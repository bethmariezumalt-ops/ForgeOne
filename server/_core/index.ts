import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);

  // iCal feed endpoint for Google Calendar subscription
  app.get("/api/calendar/feed.ics", async (req, res) => {
    try {
      const { getAllCalendarEvents } = await import("../db");
      const events = await getAllCalendarEvents();
      const lines: string[] = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Acme Fleet//Calendar//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "X-WR-CALNAME:Acme Fleet Calendar",
      ];
      for (const evt of events) {
        lines.push("BEGIN:VEVENT");
        lines.push(`UID:acme-fleet-${evt.id}@acmefleet.app`);
        const dateStr = ((evt.date as any) || "").toString().replace(/-/g, "");
        if (evt.allDay || (!evt.startTime && !evt.endTime)) {
          lines.push(`DTSTART;VALUE=DATE:${dateStr}`);
          lines.push(`DTEND;VALUE=DATE:${dateStr}`);
        } else {
          const start = (evt.startTime || "09:00").replace(":", "") + "00";
          const end = (evt.endTime || "10:00").replace(":", "") + "00";
          lines.push(`DTSTART:${dateStr}T${start}`);
          lines.push(`DTEND:${dateStr}T${end}`);
        }
        lines.push(`SUMMARY:${(evt.title || "").replace(/[\n\r]/g, " ")}`);
        if (evt.location) lines.push(`LOCATION:${evt.location}`);
        if (evt.notes) lines.push(`DESCRIPTION:${(evt.notes as string).replace(/\n/g, "\\n")}`);
        if (evt.isRecurring && evt.recurrenceRule) {
          const rruleMap: Record<string, string> = { daily: "FREQ=DAILY", weekly: "FREQ=WEEKLY", monthly: "FREQ=MONTHLY", weekdays: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR" };
          let rrule = rruleMap[evt.recurrenceRule] || "FREQ=WEEKLY";
          if (evt.recurrenceEndDate) rrule += `;UNTIL=${(evt.recurrenceEndDate as any).toString().replace(/-/g, "")}T235959Z`;
          lines.push(`RRULE:${rrule}`);
        }
        lines.push("END:VEVENT");
      }
      lines.push("END:VCALENDAR");
      res.setHeader("Content-Type", "text/calendar; charset=utf-8");
      res.setHeader("Content-Disposition", 'attachment; filename="acme-fleet-calendar.ics"');
      res.send(lines.join("\r\n"));
    } catch (err) {
      res.status(500).send("Failed to generate calendar feed");
    }
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
