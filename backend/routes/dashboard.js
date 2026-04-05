// Updated backend route - Fixed sentiment query
const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/", async (req, res) => {
  try {
    const risk = await pool.query(`
      SELECT 
        CASE
          WHEN "Churn Score" >= 80 THEN 'Immediate Action'
          WHEN "Churn Score" >= 60 THEN 'Moderate'
          WHEN "Churn Score" >= 40 THEN 'At Risk'
          ELSE 'Good'
        END AS segment,
        COUNT(*)::int as count
      FROM customers_info
      GROUP BY segment
    `);

    const churn = await pool.query(`
      SELECT 
        CASE 
          WHEN "Churn Score" > 50 THEN 'Churn'
          ELSE 'Not Churn'
        END as status,
        COUNT(*)::int as value
      FROM customers_info
      GROUP BY status
    `);

    const services = await pool.query(`
      SELECT 
        "Internet Service" as service,
        AVG("Churn Score")::float as avg_churn
      FROM customers_info
      GROUP BY "Internet Service"
    `);

    // FIXED: Sentiment query for lowercase values
    const sentiment = await pool.query(`
      SELECT 
        CASE
          WHEN sentiment_label_roberta = 'positive' THEN 'Positive'
          WHEN sentiment_label_roberta = 'negative' THEN 'Negative'
          WHEN sentiment_label_roberta = 'neutral' THEN 'Neutral'
          ELSE 'Unknown'
        END as sentiment,
        COUNT(*)::int as value
      FROM customer_feedback
      WHERE sentiment_label_roberta IS NOT NULL
      GROUP BY sentiment
    `);

    // If no sentiment data found, add default empty values
    if (sentiment.rows.length === 0) {
      sentiment.rows = [
        { sentiment: "Positive", value: 0 },
        { sentiment: "Neutral", value: 0 },
        { sentiment: "Negative", value: 0 },
      ];
    }

    const loyalty = await pool.query(`
      SELECT 
        CASE 
          WHEN "Tenure Months" >= 12 THEN 'Loyal'
          ELSE 'Not Loyal'
        END as type,
        COUNT(*)::int as value
      FROM customers_info
      GROUP BY type
    `);

    const tenure = await pool.query(`
      SELECT 
        FLOOR("Tenure Months" / 12) as years,
        COUNT(*)::int as customers
      FROM customers_info
      WHERE "Tenure Months" IS NOT NULL
      GROUP BY years
      ORDER BY years
    `);

    const serviceLife = await pool.query(`
      SELECT 
        "Internet Service" as service,
        AVG("Tenure Months")::float as avg_tenure
      FROM customers_info
      WHERE "Internet Service" IS NOT NULL
      GROUP BY "Internet Service"
      ORDER BY avg_tenure DESC
    `);

    // Get total customers count
    const totalCustomers = await pool.query(`
      SELECT COUNT(*)::int as total FROM customers_info
    `);

    // Debug log
    console.log("Sentiment data:", JSON.stringify(sentiment.rows, null, 2));
    console.log("Total customers:", totalCustomers.rows[0].total);

    res.json({
      risk: risk.rows,
      churn: churn.rows,
      services: services.rows,
      sentiment: sentiment.rows,
      loyalty: loyalty.rows,
      tenure: tenure.rows,
      serviceLife: serviceLife.rows,
      totalCustomers: totalCustomers.rows[0].total,
    });
  } catch (err) {
    console.error("Database Error:", err);
    res.status(500).json({ error: "Server Error", details: err.message });
  }
});

module.exports = router;
