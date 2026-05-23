import db from "../config/db.js";
import { generateEmbedding } from "../services/embeddingService.js";
import {
  buildProjectAIText,
  buildInvestorAIText,
  buildMentorAIText,
} from "../utils/aiTextBuilder.js";
import { cosineSimilarity } from "../utils/cosineSimilarity.js";

export async function generateProjectEmbedding(req, res) {
  try {
    const { projectId } = req.params;

    const result = await db.query("SELECT * FROM projects WHERE id = $1", [
      projectId,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Project not found" });
    }

    const project = result.rows[0];
    const aiText = buildProjectAIText(project);
    const embedding = await generateEmbedding(aiText);

    await db.query(
      "UPDATE projects SET ai_text = $1, embedding = $2 WHERE id = $3",
      [aiText, JSON.stringify(embedding), projectId]
    );

    res.json({ message: "Project AI embedding generated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to generate project embedding" });
  }
}

export async function generateInvestorEmbedding(req, res) {
  try {
    const { investorId } = req.params;

    const result = await db.query("SELECT * FROM investors WHERE id = $1", [
      investorId,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Investor not found" });
    }

    const investor = result.rows[0];
    const aiText = buildInvestorAIText(investor);
    const embedding = await generateEmbedding(aiText);

    await db.query(
      "UPDATE investors SET ai_text = $1, embedding = $2 WHERE id = $3",
      [aiText, JSON.stringify(embedding), investorId]
    );

    res.json({ message: "Investor AI embedding generated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to generate investor embedding" });
  }
}

export async function generateMentorEmbedding(req, res) {
  try {
    const { mentorId } = req.params;

    const result = await db.query("SELECT * FROM mentors WHERE id = $1", [
      mentorId,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Mentor not found" });
    }

    const mentor = result.rows[0];
    const aiText = buildMentorAIText(mentor);
    const embedding = await generateEmbedding(aiText);

    await db.query(
      "UPDATE mentors SET ai_text = $1, embedding = $2 WHERE id = $3",
      [aiText, JSON.stringify(embedding), mentorId]
    );

    res.json({ message: "Mentor AI embedding generated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to generate mentor embedding" });
  }
}

export async function recommendInvestorsForProject(req, res) {
  try {
    const { projectId } = req.params;

    const projectResult = await db.query("SELECT * FROM projects WHERE id = $1", [
      projectId,
    ]);

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ message: "Project not found" });
    }

    const project = projectResult.rows[0];

    if (!project.embedding) {
      return res.status(400).json({
        message: "Project AI embedding is missing. Generate it first.",
      });
    }

    const investorsResult = await db.query(
      "SELECT * FROM investors WHERE embedding IS NOT NULL"
    );

    const projectEmbedding = project.embedding;

    const recommendations = investorsResult.rows.map((investor) => {
      const similarityScore = cosineSimilarity(
        projectEmbedding,
        investor.embedding
      );

      let ruleScore = 0;
      const reasons = [];

      if (
        investor.interested_industries &&
        project.industry &&
        investor.interested_industries
          .toLowerCase()
          .includes(project.industry.toLowerCase())
      ) {
        ruleScore += 0.25;
        reasons.push("Investor is interested in this industry");
      }

      if (
        investor.preferred_stage &&
        project.stage &&
        investor.preferred_stage.toLowerCase() === project.stage.toLowerCase()
      ) {
        ruleScore += 0.15;
        reasons.push("Investor prefers this startup stage");
      }

      if (
        Number(project.required_amount) >= Number(investor.min_investment) &&
        Number(project.required_amount) <= Number(investor.max_investment)
      ) {
        ruleScore += 0.2;
        reasons.push("Investor funding range matches project need");
      }

      const finalScore = similarityScore * 0.4 + ruleScore;

      return {
        id: investor.id,
        name: investor.name,
        preferred_stage: investor.preferred_stage,
        min_investment: investor.min_investment,
        max_investment: investor.max_investment,
        similarityScore,
        finalScore,
        reason:
          reasons.join(", ") || "Investor profile is semantically related",
      };
    });

    recommendations.sort((a, b) => b.finalScore - a.finalScore);

    res.json(recommendations.slice(0, 10));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to recommend investors" });
  }
}

export async function recommendMentorsForProject(req, res) {
  try {
    const { projectId } = req.params;

    const projectResult = await db.query("SELECT * FROM projects WHERE id = $1", [
      projectId,
    ]);

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ message: "Project not found" });
    }

    const project = projectResult.rows[0];

    if (!project.embedding) {
      return res.status(400).json({
        message: "Project AI embedding is missing. Generate it first.",
      });
    }

    const mentorsResult = await db.query(
      "SELECT * FROM mentors WHERE embedding IS NOT NULL"
    );

    const projectEmbedding = project.embedding;

    const recommendations = mentorsResult.rows.map((mentor) => {
      const similarityScore = cosineSimilarity(
        projectEmbedding,
        mentor.embedding
      );

      let ruleScore = 0;
      const reasons = [];

      if (
        mentor.industries &&
        project.industry &&
        mentor.industries.toLowerCase().includes(project.industry.toLowerCase())
      ) {
        ruleScore += 0.3;
        reasons.push("Mentor has experience in this industry");
      }

      if (Number(mentor.experience_years) >= 3) {
        ruleScore += 0.2;
        reasons.push("Mentor has enough experience");
      }

      const finalScore = similarityScore * 0.5 + ruleScore;

      return {
        id: mentor.id,
        name: mentor.name,
        expertise_areas: mentor.expertise_areas,
        experience_years: mentor.experience_years,
        similarityScore,
        finalScore,
        reason: reasons.join(", ") || "Mentor expertise is semantically related",
      };
    });

    recommendations.sort((a, b) => b.finalScore - a.finalScore);

    res.json(recommendations.slice(0, 10));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to recommend mentors" });
  }
}

export async function recommendStartupsForInvestor(req, res) {
  try {
    const { investorId } = req.params;

    const investorResult = await db.query(
      "SELECT * FROM investors WHERE id = $1",
      [investorId]
    );

    if (investorResult.rows.length === 0) {
      return res.status(404).json({ message: "Investor not found" });
    }

    const investor = investorResult.rows[0];

    if (!investor.embedding) {
      return res.status(400).json({
        message: "Investor AI embedding is missing. Generate it first.",
      });
    }

    const projectsResult = await db.query(
      "SELECT * FROM projects WHERE embedding IS NOT NULL"
    );

    const investorEmbedding = investor.embedding;

    const recommendations = projectsResult.rows.map((project) => {
      const similarityScore = cosineSimilarity(
        investorEmbedding,
        project.embedding
      );

      let ruleScore = 0;
      const reasons = [];

      if (
        investor.interested_industries &&
        project.industry &&
        investor.interested_industries
          .toLowerCase()
          .includes(project.industry.toLowerCase())
      ) {
        ruleScore += 0.25;
        reasons.push("Industry matches investor interest");
      }

      if (
        investor.preferred_stage &&
        project.stage &&
        investor.preferred_stage.toLowerCase() === project.stage.toLowerCase()
      ) {
        ruleScore += 0.15;
        reasons.push("Startup stage matches investor preference");
      }

      if (
        Number(project.required_amount) >= Number(investor.min_investment) &&
        Number(project.required_amount) <= Number(investor.max_investment)
      ) {
        ruleScore += 0.2;
        reasons.push("Funding amount is within investor range");
      }

      const finalScore = similarityScore * 0.4 + ruleScore;

      return {
        id: project.id,
        name: project.name,
        industry: project.industry,
        stage: project.stage,
        required_amount: project.required_amount,
        similarityScore,
        finalScore,
        reason: reasons.join(", ") || "Project is semantically related",
      };
    });

    recommendations.sort((a, b) => b.finalScore - a.finalScore);

    res.json(recommendations.slice(0, 10));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to recommend startups" });
  }
}