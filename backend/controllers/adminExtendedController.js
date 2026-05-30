const pool = require("../config/db");

async function writeAudit(actorId, action, entityType, entityId, details, metadata = null) {
	await pool.query(
		`INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details, metadata)
		 VALUES ($1,$2,$3,$4,$5,$6)`,
		[actorId, action, entityType, entityId, details, metadata ? JSON.stringify(metadata) : null],
	);
}

// ——— Platform configuration ———

exports.getPlatformSettings = async (_req, res) => {
	try {
		const r = await pool.query(
			`SELECT setting_key, setting_value, updated_at FROM platform_settings ORDER BY setting_key`,
		);
		const settings = {};
		for (const row of r.rows) settings[row.setting_key] = row.setting_value;
		return res.json({ settings });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.updatePlatformSettings = async (req, res) => {
	const admin = req.user;
	const { key = "platform_config", value } = req.body || {};
	if (!value || typeof value !== "object") {
		return res.status(400).json({ error: "value object required" });
	}
	try {
		await pool.query(
			`INSERT INTO platform_settings (setting_key, setting_value, updated_by, updated_at)
			 VALUES ($1, $2::jsonb, $3, CURRENT_TIMESTAMP)
			 ON CONFLICT (setting_key) DO UPDATE SET
			   setting_value = EXCLUDED.setting_value,
			   updated_by = EXCLUDED.updated_by,
			   updated_at = CURRENT_TIMESTAMP`,
			[key, JSON.stringify(value), admin.user_id],
		);
		await writeAudit(admin.user_id, "update_platform_settings", "platform_settings", null, key);
		return res.json({ message: "Settings updated", key, value });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// ——— Categories ———

exports.listCategories = async (req, res) => {
	const { type } = req.query;
	try {
		let q = "SELECT * FROM platform_categories WHERE 1=1";
		const params = [];
		if (type) {
			params.push(type);
			q += ` AND category_type = $${params.length}`;
		}
		q += " ORDER BY name ASC";
		const r = await pool.query(q, params);
		return res.json({ categories: r.rows });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.listPublicCategories = async (req, res) => {
	const { type } = req.query;
	try {
		let q = "SELECT * FROM platform_categories WHERE is_active = true";
		const params = [];
		if (type) {
			params.push(type);
			q += ` AND category_type = $${params.length}`;
		}
		q += " ORDER BY name ASC";
		const r = await pool.query(q, params);
		return res.json({ categories: r.rows });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.createCategory = async (req, res) => {
	const { name, slug, category_type = "industry", metadata = {} } = req.body || {};
	if (!name || !slug) return res.status(400).json({ error: "name and slug required" });
	try {
		const r = await pool.query(
			`INSERT INTO platform_categories (name, slug, category_type, metadata)
			 VALUES ($1,$2,$3,$4::jsonb) RETURNING *`,
			[name, slug, category_type, JSON.stringify(metadata)],
		);
		await writeAudit(req.user.user_id, "create_category", "platform_categories", r.rows[0].category_id, name);
		return res.status(201).json({ category: r.rows[0] });
	} catch (err) {
		if (err.code === "23505") return res.status(409).json({ error: "Slug already exists" });
		return res.status(500).json({ error: err.message });
	}
};

exports.updateCategory = async (req, res) => {
	const { id } = req.params;
	const { name, is_active, metadata } = req.body || {};
	try {
		const r = await pool.query(
			`UPDATE platform_categories SET
			   name = COALESCE($1, name),
			   is_active = COALESCE($2, is_active),
			   metadata = COALESCE($3::jsonb, metadata),
			   updated_at = CURRENT_TIMESTAMP
			 WHERE category_id = $4 RETURNING *`,
			[name, is_active, metadata ? JSON.stringify(metadata) : null, id],
		);
		if (!r.rows.length) return res.status(404).json({ error: "Category not found" });
		return res.json({ category: r.rows[0] });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.deleteCategory = async (req, res) => {
	try {
		const r = await pool.query("DELETE FROM platform_categories WHERE category_id = $1 RETURNING category_id", [
			req.params.id,
		]);
		if (!r.rows.length) return res.status(404).json({ error: "Category not found" });
		return res.json({ message: "Category deleted" });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// Public suggestion endpoint for new categories. Try to store in a suggestion table;
// if that table doesn't exist fall back to creating a disabled platform category.
exports.suggestCategory = async (req, res) => {
	const { name, category_type = "industry", contact_email = null, note = null } = req.body || {};
	if (!name) return res.status(400).json({ error: "name required" });
	try {
		// Primary: try suggestions table (if present)
		try {
			const r = await pool.query(
				`INSERT INTO category_suggestions (name, category_type, contact_email, note)
				 VALUES ($1,$2,$3,$4) RETURNING *`,
				[name.trim(), category_type, contact_email, note],
			);
			await writeAudit(req.user?.user_id || null, "suggest_category", "category_suggestions", r.rows[0].suggestion_id, name);
			return res.status(201).json({ suggestion: r.rows[0], message: "Suggestion received" });
		} catch (innerErr) {
			// If the suggestions table doesn't exist, fall back to adding a disabled platform category
			if (innerErr && /category_suggestions/.test(innerErr.message || "")) {
				const slug = name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
				const r2 = await pool.query(
					`INSERT INTO platform_categories (name, slug, category_type, is_active, metadata)
					 VALUES ($1,$2,$3,false,$4::jsonb) RETURNING *`,
					[name.trim(), slug, category_type, JSON.stringify({ suggested: true, contact_email, note })],
				);
				await writeAudit(req.user?.user_id || null, "suggest_category_fallback", "platform_categories", r2.rows[0].category_id, name);
				return res.status(201).json({ category: r2.rows[0], message: "Suggestion received (stored for admin review)" });
			}
			throw innerErr;
		}
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// ——— User audit & verify ———

exports.getUserAuditLogs = async (req, res) => {
	const { userId } = req.params;
	const { limit = 50, offset = 0 } = req.query;
	try {
		const r = await pool.query(
			`SELECT al.*, u.email AS actor_email
			 FROM audit_logs al
			 LEFT JOIN users u ON u.user_id = al.actor_user_id
			 WHERE al.entity_id = $1 OR al.actor_user_id = $1
			    OR al.details ILIKE '%' || $1::text || '%'
			 ORDER BY al.created_at DESC
			 LIMIT $2 OFFSET $3`,
			[userId, limit, offset],
		);
		return res.json({ logs: r.rows });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.verifyUserEmail = async (req, res) => {
	const { userId } = req.params;
	try {
		const r = await pool.query(
			`UPDATE users SET email_verified = true, updated_at = CURRENT_TIMESTAMP
			 WHERE user_id = $1 RETURNING user_id, email, email_verified`,
			[userId],
		);
		if (!r.rows.length) return res.status(404).json({ error: "User not found" });
		await writeAudit(req.user.user_id, "admin_verify_email", "users", userId, null);
		return res.json({ user: r.rows[0], message: "Email marked verified" });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.restoreUser = async (req, res) => {
	const { userId } = req.params;
	try {
		const r = await pool.query(
			`UPDATE users SET is_active = true, is_approved = COALESCE(is_approved, false)
			 WHERE user_id = $1 RETURNING user_id, email, is_active, is_approved`,
			[userId],
		);
		if (!r.rows.length) return res.status(404).json({ error: "User not found" });
		await writeAudit(req.user.user_id, "restore_user", "users", userId, null);
		return res.json({ user: r.rows[0], message: "User restored" });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// ——— Investment disputes & legitimacy ———

exports.listInvestmentDisputes = async (_req, res) => {
	try {
		const r = await pool.query(
			`SELECT d.*,
			        ir.requested_amount, s.startup_name, i.organization_name
			 FROM investment_disputes d
			 LEFT JOIN investment_requests ir ON ir.investment_request_id = d.investment_request_id
			 LEFT JOIN startups s ON s.startup_id = ir.startup_id
			 LEFT JOIN investors i ON i.investor_id = ir.investor_id
			 ORDER BY d.created_at DESC`,
		);
		return res.json({ disputes: r.rows });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.createInvestmentDispute = async (req, res) => {
	const { investment_id, investment_request_id, reason } = req.body || {};
	if (!reason) return res.status(400).json({ error: "reason required" });
	if (!investment_id && !investment_request_id) {
		return res.status(400).json({ error: "investment_id or investment_request_id required" });
	}
	try {
		const r = await pool.query(
			`INSERT INTO investment_disputes (investment_id, investment_request_id, reported_by_user_id, reason)
			 VALUES ($1,$2,$3,$4) RETURNING *`,
			[investment_id || null, investment_request_id || null, req.user.user_id, reason],
		);
		await writeAudit(req.user.user_id, "create_investment_dispute", "investment_disputes", r.rows[0].dispute_id, reason);
		return res.status(201).json({ dispute: r.rows[0] });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.resolveInvestmentDispute = async (req, res) => {
	const { id } = req.params;
	const { status, resolution_notes } = req.body || {};
	const allowed = ["investigating", "resolved", "dismissed"];
	if (!allowed.includes(status)) return res.status(400).json({ error: "Invalid status" });
	try {
		const r = await pool.query(
			`UPDATE investment_disputes SET
			   status = $1,
			   resolution_notes = COALESCE($2, resolution_notes),
			   resolved_by = $3,
			   resolved_at = CASE WHEN $1 IN ('resolved','dismissed') THEN CURRENT_TIMESTAMP ELSE resolved_at END,
			   updated_at = CURRENT_TIMESTAMP
			 WHERE dispute_id = $4 RETURNING *`,
			[status, resolution_notes, req.user.user_id, id],
		);
		if (!r.rows.length) return res.status(404).json({ error: "Dispute not found" });
		return res.json({ dispute: r.rows[0] });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.verifyInvestmentLegitimacy = async (req, res) => {
	const { id } = req.params;
	const type = String(req.path || "").includes("investment-requests") ? "request" : "investment";
	const admin = req.user;
	try {
		if (type === "investment") {
			const r = await pool.query(
				`UPDATE investments SET admin_verified = true WHERE investment_id = $1 RETURNING *`,
				[id],
			);
			if (!r.rows.length) return res.status(404).json({ error: "Investment not found" });
			await writeAudit(admin.user_id, "verify_investment", "investments", id, null);
			return res.json({ investment: r.rows[0] });
		}
		const r = await pool.query(
			`UPDATE investment_requests SET admin_verified = true, admin_verified_at = CURRENT_TIMESTAMP, admin_verified_by = $1
			 WHERE investment_request_id = $2 RETURNING *`,
			[admin.user_id, id],
		);
		if (!r.rows.length) return res.status(404).json({ error: "Investment request not found" });
		await writeAudit(admin.user_id, "verify_investment_request", "investment_requests", id, null);
		return res.json({ investment_request: r.rows[0] });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// ——— Payments: detail, refund, suspicious, chargeback ———

exports.getPaymentById = async (req, res) => {
	try {
		const r = await pool.query(
			`SELECT p.*,
			        u_from.email AS from_email, u_from.first_name AS from_first_name, u_from.last_name AS from_last_name,
			        u_to.email AS to_email, u_to.first_name AS to_first_name, u_to.last_name AS to_last_name
			 FROM payments p
			 JOIN users u_from ON u_from.user_id = p.from_user_id
			 JOIN users u_to ON u_to.user_id = p.to_user_id
			 WHERE p.payment_id = $1`,
			[req.params.paymentId],
		);
		if (!r.rows.length) return res.status(404).json({ error: "Payment not found" });
		return res.json({ payment: r.rows[0] });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.refundPayment = async (req, res) => {
	const { paymentId } = req.params;
	const { notes } = req.body || {};
	try {
		const r = await pool.query(
			`UPDATE payments SET status = 'refunded', refund_status = 'refunded', admin_notes = COALESCE($1, admin_notes)
			 WHERE payment_id = $2 AND status = 'completed' RETURNING *`,
			[notes, paymentId],
		);
		if (!r.rows.length) {
			return res.status(400).json({ error: "Payment not found or not refundable" });
		}
		await writeAudit(req.user.user_id, "refund_payment", "payments", paymentId, notes);
		return res.json({ payment: r.rows[0], message: "Payment marked refunded" });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.flagPaymentSuspicious = async (req, res) => {
	const { paymentId } = req.params;
	const { suspicious = true, notes } = req.body || {};
	try {
		const r = await pool.query(
			`UPDATE payments SET is_suspicious = $1, admin_notes = COALESCE($2, admin_notes)
			 WHERE payment_id = $3 RETURNING *`,
			[!!suspicious, notes, paymentId],
		);
		if (!r.rows.length) return res.status(404).json({ error: "Payment not found" });
		await writeAudit(req.user.user_id, suspicious ? "flag_payment_suspicious" : "unflag_payment", "payments", paymentId, notes);
		return res.json({ payment: r.rows[0] });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.recordChargeback = async (req, res) => {
	const { paymentId } = req.params;
	const { notes } = req.body || {};
	try {
		const r = await pool.query(
			`UPDATE payments SET chargeback_status = 'open', is_suspicious = true, admin_notes = COALESCE($1, admin_notes)
			 WHERE payment_id = $2 RETURNING *`,
			[notes, paymentId],
		);
		if (!r.rows.length) return res.status(404).json({ error: "Payment not found" });
		await writeAudit(req.user.user_id, "chargeback_payment", "payments", paymentId, notes);
		return res.json({ payment: r.rows[0] });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.listSuspiciousPayments = async (_req, res) => {
	try {
		const r = await pool.query(
			`SELECT p.*, u_from.email AS from_email, u_to.email AS to_email
			 FROM payments p
			 JOIN users u_from ON u_from.user_id = p.from_user_id
			 JOIN users u_to ON u_to.user_id = p.to_user_id
			 WHERE p.is_suspicious = true OR p.chargeback_status IS NOT NULL
			 ORDER BY p.created_at DESC LIMIT 100`,
		);
		return res.json({ payments: r.rows });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// ——— Content moderation queue ———

exports.listContentFlags = async (req, res) => {
	const { status = "pending" } = req.query;
	try {
		await pool.query(`
			INSERT INTO content_flags (entity_type, entity_id, reason, status)
			SELECT 'chat_log', log_id, flagged_reason, 'pending'
			FROM chat_moderation_logs
			WHERE flagged_reason IS NOT NULL
			ON CONFLICT (entity_type, entity_id) DO NOTHING
		`).catch(() => {});

		const r = await pool.query(
			`SELECT * FROM content_flags WHERE ($1 = 'all' OR status = $1) ORDER BY created_at DESC LIMIT 200`,
			[status],
		);
		return res.json({ flags: r.rows });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.reviewContentFlag = async (req, res) => {
	const { id } = req.params;
	const { status, notes } = req.body || {};
	const allowed = ["approved", "removed", "dismissed"];
	if (!allowed.includes(status)) return res.status(400).json({ error: "Invalid status" });
	try {
		const flag = await pool.query("SELECT * FROM content_flags WHERE flag_id = $1", [id]);
		if (!flag.rows.length) return res.status(404).json({ error: "Flag not found" });
		const f = flag.rows[0];

		if (status === "removed" && f.entity_type === "project") {
			await pool.query("UPDATE projects SET status = 'cancelled' WHERE project_id = $1", [f.entity_id]);
		}

		const r = await pool.query(
			`UPDATE content_flags SET status = $1, reviewed_by = $2, reviewed_at = CURRENT_TIMESTAMP
			 WHERE flag_id = $3 RETURNING *`,
			[status, req.user.user_id, id],
		);
		await writeAudit(req.user.user_id, "review_content_flag", "content_flags", id, notes || status);
		return res.json({ flag: r.rows[0] });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.flagProjectContent = async (req, res) => {
	const { projectId } = req.params;
	const { reason } = req.body || {};
	try {
		const r = await pool.query(
			`INSERT INTO content_flags (entity_type, entity_id, flagged_by_user_id, reason, status)
			 VALUES ('project', $1, $2, $3, 'pending')
			 ON CONFLICT (entity_type, entity_id) DO UPDATE SET reason = EXCLUDED.reason, status = 'pending'
			 RETURNING *`,
			[projectId, req.user.user_id, reason || "Flagged for review"],
		);
		return res.json({ flag: r.rows[0] });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// ——— Reports: financial, usage, KPI ———

exports.financialReport = async (_req, res) => {
	try {
		const r = await pool.query(`
			SELECT
				COUNT(*) FILTER (WHERE status = 'completed')::int AS completed_count,
				COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0)::numeric AS gross_volume,
				COALESCE(SUM(platform_fee) FILTER (WHERE status = 'completed'), 0)::numeric AS platform_revenue,
				COALESCE(SUM(amount) FILTER (WHERE status = 'refunded'), 0)::numeric AS refunded_volume,
				COUNT(*) FILTER (WHERE is_suspicious = true)::int AS suspicious_count,
				COUNT(*) FILTER (WHERE chargeback_status IS NOT NULL)::int AS chargeback_count
			FROM payments
		`);
		const byType = await pool.query(`
			SELECT reference_type, COUNT(*)::int AS count, COALESCE(SUM(amount),0)::numeric AS volume
			FROM payments WHERE status = 'completed'
			GROUP BY reference_type
		`);
		return res.json({ summary: r.rows[0], by_reference_type: byType.rows });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.usageReport = async (req, res) => {
	const days = Math.min(365, Math.max(1, parseInt(req.query.days, 10) || 30));
	try {
		const r = await pool.query(
			`SELECT
				(SELECT COUNT(*)::int FROM users WHERE created_at >= NOW() - ($1 || ' days')::interval) AS new_users,
				(SELECT COUNT(*)::int FROM projects WHERE created_at >= NOW() - ($1 || ' days')::interval) AS new_projects,
				(SELECT COUNT(*)::int FROM investment_requests WHERE created_at >= NOW() - ($1 || ' days')::interval) AS new_funding_requests,
				(SELECT COUNT(*)::int FROM mentorship_sessions WHERE created_at >= NOW() - ($1 || ' days')::interval) AS new_sessions,
				(SELECT COUNT(*)::int FROM auth_login_attempts WHERE created_at >= NOW() - ($1 || ' days')::interval) AS login_attempts`,
			[days],
		);
		return res.json({ period_days: days, usage: r.rows[0] });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.kpiReport = async (_req, res) => {
	try {
		const r = await pool.query(`
			SELECT
				(SELECT COUNT(*)::int FROM users) AS total_users,
				(SELECT COUNT(*)::int FROM users WHERE is_approved = true AND is_active = true) AS active_verified_users,
				(SELECT COUNT(*)::int FROM startups) AS total_startups,
				(SELECT COUNT(*)::int FROM investments) AS total_investments,
				(SELECT COUNT(*)::int FROM payments WHERE status = 'completed') AS completed_payments,
				(SELECT COALESCE(SUM(platform_fee),0)::numeric FROM payments WHERE status = 'completed') AS total_platform_revenue
		`);
		return res.json({ kpis: r.rows[0] });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// ——— Maintenance: backup, recovery, errors ———

exports.getBackupStatus = async (_req, res) => {
	try {
		const r = await pool.query(
			`SELECT setting_value FROM platform_settings WHERE setting_key = 'backup_metadata'`,
		);
		const meta = r.rows[0]?.setting_value || {
			last_backup_at: null,
			last_backup_status: "not_configured",
			storage: "manual",
		};
		return res.json({ backup: meta });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.triggerBackup = async (req, res) => {
	const admin = req.user;
	const meta = {
		last_backup_at: new Date().toISOString(),
		last_backup_status: "completed",
		storage: "platform_metadata_snapshot",
		triggered_by: admin.user_id,
	};
	try {
		await pool.query(
			`INSERT INTO platform_settings (setting_key, setting_value, updated_by)
			 VALUES ('backup_metadata', $1::jsonb, $2)
			 ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_by = EXCLUDED.updated_by`,
			[JSON.stringify(meta), admin.user_id],
		);
		await writeAudit(admin.user_id, "trigger_backup", "platform_settings", null, "metadata snapshot");
		return res.json({ message: "Backup metadata recorded", backup: meta });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.listErrorLogs = async (req, res) => {
	const { limit = 100 } = req.query;
	try {
		const errors = await pool.query(
			`SELECT log_id, source, level, message, metadata, created_at
			 FROM system_error_logs ORDER BY created_at DESC LIMIT $1`,
			[limit],
		);
		const security = await pool.query(
			`SELECT event_id, event_type AS source, severity AS level, details AS message, created_at
			 FROM security_events WHERE severity IN ('high', 'medium')
			 ORDER BY created_at DESC LIMIT $1`,
			[Math.min(50, limit)],
		);
		return res.json({
			error_logs: errors.rows,
			security_alerts: security.rows,
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.logSystemError = async (req, res) => {
	const { source, level = "error", message, metadata } = req.body || {};
	if (!message) return res.status(400).json({ error: "message required" });
	try {
		const r = await pool.query(
			`INSERT INTO system_error_logs (source, level, message, metadata)
			 VALUES ($1,$2,$3,$4::jsonb) RETURNING *`,
			[source || "admin", level, message, metadata ? JSON.stringify(metadata) : null],
		);
		return res.status(201).json({ log: r.rows[0] });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.getFraudSummary = async (_req, res) => {
	try {
		const r = await pool.query(`
			SELECT
				(SELECT COUNT(*)::int FROM payments WHERE is_suspicious = true) AS suspicious_payments,
				(SELECT COUNT(*)::int FROM payments WHERE chargeback_status IS NOT NULL) AS chargebacks,
				(SELECT COUNT(*)::int FROM security_events WHERE severity IN ('high','critical') AND created_at >= NOW() - INTERVAL '7 days') AS critical_security_events,
				(SELECT COUNT(*)::int FROM chat_user_violations WHERE violation_count >= 3) AS repeat_offenders,
				(SELECT COUNT(*)::int FROM investment_disputes WHERE status = 'open') AS open_investment_disputes
		`);
		return res.json({ fraud: r.rows[0] });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};
