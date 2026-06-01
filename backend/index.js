const http = require("http");
const express = require("express");
const pool = require("./config/db");
const { initDatabase } = require("./services/initDatabase");
const initializeSocket = require("./socket");
const { setSocketServer } = require("./services/socketBus");
const authRoutes = require("./routes/authRoutes");
const {
	requireVerifiedAndApprovedIfAuthenticated,
} = require("./middleware/authMiddleware");

const app = express();
const server = http.createServer(app);
const io = initializeSocket(server);
setSocketServer(io);
const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || "0.0.0.0";
const STARTUP_RETRIES = Number(process.env.STARTUP_RETRIES) || 5;

// Middleware
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Lightweight liveness for Render/load balancers (no DB — must respond quickly)
app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true, uptime: process.uptime() });
});

app.get("/health/ready", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({ ok: true, db: true });
  } catch (err) {
    res.status(503).json({ ok: false, db: false, error: err.message });
  }
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api", requireVerifiedAndApprovedIfAuthenticated);

app.get("/", (_req, res) => res.json({ service: "StartupConnect API" }));

const testRoutes = require("./routes/testRoutes");
app.use("/api/test", testRoutes);

const startupRoutesComplete = require("./routes/startupRoutesComplete");
const startupRoutes = require("./routes/startupRoutes");
app.use("/api/startups", startupRoutesComplete);
app.use("/api/startups", startupRoutes);

const projectRoutes = require("./routes/projectRoutes");
app.use("/api/projects", projectRoutes);

const investmentRoutes = require("./routes/investmentRoutes");
app.use("/api/investments", investmentRoutes);

const messageRoutes = require("./routes/messageRoutes");
app.use("/api/messages", messageRoutes);

const investorRoutes = require("./routes/investorRoutes");
app.use("/api/investors", investorRoutes);

const paymentRoutes = require("./routes/paymentRoutes");
app.use("/api/payments", paymentRoutes);

const mentorRoutes = require("./routes/mentorRoutes");
app.use("/api/mentors", mentorRoutes);

const mentorshipRoutes = require("./routes/mentorshipRoutes");
app.use("/api/mentorship", mentorshipRoutes);

const adminRoutes = require("./routes/adminRoutes");
app.use("/api/admin", adminRoutes);

const notificationRoutes = require("./routes/notificationRoutes");
app.use("/api/notifications", notificationRoutes);

const chatRoutes = require("./routes/chatRoutes");
app.use("/api/chat", chatRoutes);

const aiMentorRoutes = require("./routes/aiMentorRoutes");
app.use("/api/ai-mentor", aiMentorRoutes);

const miscRoutes = require("./routes/miscRoutes");
app.use("/api", miscRoutes);

const startupDashboardRoutes = require("./routes/startupDashboardRoutes");
app.use("/api/startup-dashboard", startupDashboardRoutes);

const discoverRoutes = require("./routes/discoverRoutes");
app.use("/api/startups/discover", discoverRoutes);

const ratingRoutes = require("./routes/ratingRoutes");
app.use("/api/ratings", ratingRoutes);

async function startServer() {
	try {
		await initDatabase();
		server.listen(PORT, () => {
			console.log(`Server running on port ${PORT} (Legacy Monolith)`);
		});
	} catch (err) {
		console.error("Server startup failed:", err.message || err);
		process.exit(1);
	}
}

async function startServer() {
  let lastErr;
  for (let attempt = 1; attempt <= STARTUP_RETRIES; attempt += 1) {
    try {
      await initDatabase();
      const { getMailProviderStatus } = require("./utils/mail");
      const mailStatus = getMailProviderStatus();
      console.log(
        `Email delivery: ${mailStatus.activeProvider}` +
          (mailStatus.render && !mailStatus.brevoApiConfigured
            ? " — set BREVO_HTTP_API_KEY (xkeysib) on Render"
            : ""),
      );
      await new Promise((resolve, reject) => {
        server.listen(PORT, HOST, () => resolve());
        server.once("error", reject);
      });
      console.log(`Server running on http://${HOST}:${PORT}`);
      return;
    } catch (err) {
      lastErr = err;
      console.error(
        `Server startup attempt ${attempt}/${STARTUP_RETRIES} failed:`,
        err.message || err,
      );
      if (attempt < STARTUP_RETRIES) {
        await sleep(Math.min(3000 * attempt, 15_000));
      }
    }
  }
  console.error("Server startup failed after retries:", lastErr?.message || lastErr);
  process.exit(1);
}

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});

startServer();
