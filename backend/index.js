const express = require("express");
const pool = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const http = require("http");
const socketUtils = require("./utils/socket");

// Middleware
app.use(
	express.json({
		verify: (req, res, buf) => {
			req.rawBody = buf.toString("utf8");
		},
	}),
);

// ✅ Routes FIRST
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// Test DB connection
app.get("/", async (req, res) => {
	try {
		const result = await pool.query("SELECT NOW()");
		res.json({
			message: "Database connected ✅",
			time: result.rows[0],
		});
	} catch (err) {
		res.status(500).send(err.message);
	}
});

const testRoutes = require("./routes/testRoutes");
app.use("/api/test", testRoutes);

const startupRoutes = require("./routes/startupRoutes");
app.use("/api/startups", startupRoutes);

const projectRoutes = require("./routes/projectRoutes");
app.use("/api/projects", projectRoutes);

const investmentRoutes = require("./routes/investmentRoutes");
app.use("/api/investments", investmentRoutes);

const investorRoutes = require("./routes/investorRoutes");
app.use("/api/investors", investorRoutes);

const mentorRoutes = require("./routes/mentorRoutes");
app.use("/api/mentors", mentorRoutes);

const mentorshipRoutes = require("./routes/mentorshipRoutes");
app.use("/api/mentorship", mentorshipRoutes);

const adminRoutes = require("./routes/adminRoutes");
app.use("/api/admin", adminRoutes);

const reportRoutes = require("./routes/reportRoutes");
app.use("/api/reports", reportRoutes);

const notificationRoutes = require("./routes/notificationRoutes");
app.use("/api/notifications", notificationRoutes);

const conversationRoutes = require("./routes/conversationRoutes");
app.use("/api/conversations", conversationRoutes);

const messageRoutes = require("./routes/messageRoutes");
app.use("/api/messages", messageRoutes);

const videoSessionRoutes = require("./routes/videoSessionRoutes");
app.use("/api/video-sessions", videoSessionRoutes);

const sessionReminderService = require("./services/sessionReminderService");
sessionReminderService.startSessionReminderScheduler();

// Start server LAST (create http server to attach socket.io)
const server = http.createServer(app);
socketUtils.init(server);

server.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
