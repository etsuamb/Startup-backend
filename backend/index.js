const express = require("express");
const pool = require("./config/db");
const authRoutes = require("./routes/authRoutes");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Middleware
app.use(express.json());

// ✅ Routes FIRST
app.use("/api/auth", authRoutes);

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

const notificationRoutes = require("./routes/notificationRoutes");
app.use("/api/notifications", notificationRoutes);

// Start server LAST
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
