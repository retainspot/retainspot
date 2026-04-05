// Dashboard.jsx - Complete with Google GenAI SDK and gemini-3-flash-preview
import React, { useEffect, useState, useRef } from "react";
import * as d3 from "d3";
import { GoogleGenAI } from "@google/genai";
import "./Dashboard.css";

const PURPLE = "#7c3aed";
const PURPLE_DARK = "#6d28d9";
const ORANGE = "#f97316";
const GREEN = "#10b981";
const RED = "#ef4444";
const BLUE = "#3b82f6";
const YELLOW = "#fbbf24";
const PINK = "#ec4899";
const TEAL = "#14b8a6";
const INDIGO = "#6366f1";
const GRAY = "#64748b";

// ========== GEMINI API CONFIGURATION ==========
const GEMINI_API_KEY = "AIzaSyDqmQ2n5rCWiBXoED6Oh2L8PG35JxhnaXs";

// Initialize the Gemini client
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const callGeminiAPI = async (chartType, chartData, chartTitle) => {
  // Build comprehensive data summary with exact numbers and chart context
  let contextPrompt = "";

  if (chartType === "Churn vs Not Churn") {
    const churned = chartData.find((d) => d.status === "Churn")?.value || 0;
    const retained =
      chartData.find((d) => d.status === "Not Churn")?.value || 0;
    const total = churned + retained;
    const churnRate = ((churned / total) * 100).toFixed(1);
    const retentionRate = ((retained / total) * 100).toFixed(1);

    contextPrompt = `CHART INFORMATION:
- Chart Name: "Churn vs Retention Donut Chart"
- Chart Type: Donut Pie Chart
- What it shows: Comparison between customers who have churned vs those who remain active
- Data Structure: Two categories - "Churn" and "Not Churn" with their respective customer counts
- How to interpret: The donut hole shows the total, the colored segments show the proportion

EXACT DATA FROM THIS CHART:
- Total customers: ${total}
- Churned: ${churned} customers
- Retained: ${retained} customers  
- Churn rate: ${churnRate}%
- Retention rate: ${retentionRate}%

- Dont make your own assumptions or calculations - use only the numbers provided above. If a percentage is not provided, do not calculate it yourself. Use the exact numbers from the data above in your analysis.
SENTENCE STRUCTURE TO FOLLOW (write exactly 5 sentences):

Sentence 1 - STATE THE VISUAL FACT: "The donut chart shows that out of ${total} total customers, ${churned} have churned (${churnRate}% of the donut) and ${retained} remain active (${retentionRate}% of the donut)."

`;
  } else if (chartType === "Retention vs Churn") {
    const servicesData = chartData.map((d) => ({
      service: d.service,
      churnRate: d.avg_churn.toFixed(1),
      retentionRate: (100 - d.avg_churn).toFixed(1),
    }));

    const sortedByRetention = [...servicesData].sort(
      (a, b) => parseFloat(b.retentionRate) - parseFloat(a.retentionRate),
    );
    const best = sortedByRetention[0];
    const worst = sortedByRetention[sortedByRetention.length - 1];
    const gap = (
      parseFloat(best.retentionRate) - parseFloat(worst.retentionRate)
    ).toFixed(1);
    const otherServices = sortedByRetention
      .slice(1, -1)
      .map((s) => `${s.service} (${s.retentionRate}%)`)
      .join(", ");

    contextPrompt = `CHART INFORMATION:
- Chart Name: "Retention vs Churn by Service - Side by Side Bar Chart"
- Chart Type: Grouped Bar Chart (Side by Side)
- What it shows: Comparison of retention rates (purple bars) vs churn rates (orange bars) across different internet service types
- Data Structure: Each service has two bars - one for retention percentage, one for churn percentage
- How to interpret: Taller purple bars = better retention. Taller orange bars = worse churn. Bars should add to 100% for each service
- Dont make your own assumptions or calculations - use only the numbers provided above. If a percentage is not provided, do not calculate it yourself. Use the exact numbers from the data above in your analysis.

EXACT DATA FROM THIS CHART:
${servicesData.map((s) => `- ${s.service}: ${s.retentionRate}% retention (purple bar), ${s.churnRate}% churn (orange bar)`).join("\n")}

KEY FINDINGS FROM THE BARS:
- Highest purple bar (best retention): ${best.service} at ${best.retentionRate}%
- Lowest purple bar (worst retention): ${worst.service} at ${worst.retentionRate}%  
- Gap between tallest and shortest purple bars: ${gap} percentage points
- Other services in order: ${otherServices || "none"}

SENTENCE STRUCTURE TO FOLLOW (write exactly 5 sentences):

Sentence 1 - BEST PERFORMER: "The tallest purple bar belongs to ${best.service}, which retains ${best.retentionRate}% of its customers with only ${(100 - parseFloat(best.retentionRate)).toFixed(1)}% churn (shortest orange bar)."

Sentence 2 - WORST PERFORMER: "The shortest purple bar is ${worst.service}, which retains only ${worst.retentionRate}% of customers and has ${(100 - parseFloat(worst.retentionRate)).toFixed(1)}% churn (tallest orange bar)."

Sentence 3 - THE GAP: "There is a ${gap} percentage point gap between the best and worst performing services, indicating inconsistent service quality."

Sentence 4 - ROOT CAUSE ANALYSIS: "${worst.service} customers likely churn because [choose one: slower internet speeds / higher prices / poor customer service / reliability issues], while ${best.service} customers stay due to [choose one: better value / faster speeds / reliable connection / good support]."

Sentence 5 - RECOMMENDATION: "Immediately investigate why ${worst.service} has such high churn, replicate ${best.service}'s successful playbook, and consider upgrading infrastructure or adjusting pricing for ${worst.service}."

Now write your analysis following this exact structure, using the actual service names and percentages from the data above. Be specific about which bars you're referring to.`;
  } else if (chartType === "Sentiment") {
    const positive =
      chartData.find((d) => d.sentiment === "Positive")?.value || 0;
    const negative =
      chartData.find((d) => d.sentiment === "Negative")?.value || 0;
    const neutral =
      chartData.find((d) => d.sentiment === "Neutral")?.value || 0;
    const total = positive + negative + neutral;
    const positivePercent = ((positive / total) * 100).toFixed(1);
    const negativePercent = ((negative / total) * 100).toFixed(1);
    const neutralPercent = ((neutral / total) * 100).toFixed(1);

    contextPrompt = `CHART INFORMATION:
- Chart Name: "Customer Sentiment Stacked Bar Chart"
- Chart Type: Stacked Bar Chart (100% stack)
- What it shows: Distribution of customer sentiment across three categories - Positive (green), Neutral (yellow), Negative (red)
- Data Structure: Single bar stacked with three segments representing Positive, Neutral, and Negative counts
- How to interpret: The total height of the bar represents total feedback responses. Each colored segment's height shows the proportion of that sentiment type
- Dont make your own assumptions or calculations - use only the numbers provided above. If a percentage is not provided, do not calculate it yourself. Use the exact numbers from the data above in your analysis.

EXACT DATA FROM THIS CHART:
- Positive segment (green, bottom): ${positive} customers (${positivePercent}% of the stack)
- Neutral segment (yellow, middle): ${neutral} customers (${neutralPercent}% of the stack)
- Negative segment (red, top): ${negative} customers (${negativePercent}% of the stack)
- Total stack height: ${total} total feedback responses

SENTENCE STRUCTURE TO FOLLOW (write exactly 5 sentences):

Sentence 1 - STACK COMPOSITION: "The stacked bar shows ${positivePercent}% positive (green, ${positive} customers), ${neutralPercent}% neutral (yellow, ${neutral} customers), and ${negativePercent}% negative (red, ${negative} customers) out of ${total} total feedback responses."

Sentence 2 - SENTIMENT ASSESSMENT: "This sentiment distribution is [excellent if positive > 70% / good if positive > 50% / mixed if positive 30-50% / poor if positive < 30%] because [explain based on the numbers - e.g., positive outweighs negative by X to 1]."

Sentence 3 - CHURN RISK FROM RED SEGMENT: "The red (negative) segment represents ${negative} unhappy customers who are 4x more likely to churn within 30 days, posing a serious retention risk."

Sentence 4 - IMMEDIATE ACTION FOR RED SEGMENT: "This week, prioritize contacting all ${negative} customers in the red (negative) segment, acknowledge their specific complaints, and offer compensation or solutions to prevent churn."

Sentence 5 - STRATEGIC FIX FOR YELLOW SEGMENT: "Over the next month, analyze why ${neutral} customers are in the yellow (neutral) segment, implement targeted engagement campaigns to convert them to positive, and fix root causes of negative feedback."

Now write your analysis following this exact structure, using the numbers from the data above. Always reference the colored segments (green, yellow, red) when describing the stack.`;
  } else if (chartType === "Loyalty") {
    const loyal = chartData.find((d) => d.type === "Loyal")?.value || 0;
    const notLoyal = chartData.find((d) => d.type === "Not Loyal")?.value || 0;
    const total = loyal + notLoyal;
    const loyalPercent = ((loyal / total) * 100).toFixed(1);
    const notLoyalPercent = ((notLoyal / total) * 100).toFixed(1);

    contextPrompt = `CHART INFORMATION:
- Chart Name: "Loyalty Status Pie Chart"
- Chart Type: Standard Pie Chart (not donut - solid pie)
- What it shows: Proportion of loyal customers (green slice) vs non-loyal customers (red slice)
- Data Structure: Two slices - "Loyal" (tenure >= 12 months) and "Not Loyal" (tenure < 12 months)
- How to interpret: Larger green slice = healthier business. Loyal defined as customers who have stayed for 12+ months
- Dont make your own assumptions or calculations - use only the numbers provided above. If a percentage is not provided, do not calculate it yourself. Use the exact numbers from the data above in your analysis.

EXACT DATA FROM THIS CHART:
- Loyal slice (green): ${loyal} customers (${loyalPercent}% of the pie)
- Not Loyal slice (red): ${notLoyal} customers (${notLoyalPercent}% of the pie)
- Total pie (all customers): ${total}

SENTENCE STRUCTURE TO FOLLOW (write exactly 5 sentences):

Sentence 1 - PIE COMPOSITION: "The pie chart shows that ${loyalPercent}% of customers (${loyal} customers) are Loyal (green slice), while ${notLoyalPercent}% (${notLoyal} customers) are Not Loyal (red slice)."

Sentence 2 - LOYALTY ASSESSMENT: "A ${loyalPercent}% loyalty rate is [excellent if > 60% / good if 40-60% / poor if < 40%] because [explain - e.g., most customers are staying beyond a year, or too many leave before 12 months]."

Sentence 3 - REVENUE IMPACT: "Loyal customers in the green slice generate approximately 3x more revenue and have 85% lower churn compared to the red slice, making them 5x more profitable."

Sentence 4 - CONVERSION STRATEGY FOR RED SLICE: "To convert the ${notLoyal} customers in the red slice, implement a 'First 3 Months' engagement program with check-in calls, exclusive discounts, and milestone rewards at 3, 6, and 9 months."

Sentence 5 - LOYALTY PROGRAM ENHANCEMENT: "Enhance the loyalty program for the ${loyal} customers in the green slice by adding referral bonuses, VIP support access, and annual appreciation gifts to increase their lifetime value."

Now write your analysis following this exact structure, using the numbers from the data above. Always reference the colored slices (green for loyal, red for not loyal).`;
  } else if (chartType === "Tenure") {
    const firstYear = chartData[0];
    const lastYear = chartData[chartData.length - 1];
    const peakYear = chartData.reduce(
      (max, item) => (item.customers > max.customers ? item : max),
      chartData[0],
    );
    const totalDrop = firstYear.customers - lastYear.customers;
    const dropOffPercent = ((totalDrop / firstYear.customers) * 100).toFixed(1);
    const yearsToPeak = peakYear.years - firstYear.years;

    contextPrompt = `CHART INFORMATION:
- Chart Name: "Tenure Decay Curve - Line Chart with Area Fill"
- Chart Type: Line Chart with filled area underneath
- What it shows: How customer count changes over years of tenure, from year 0 to year ${lastYear.years}
- Data Structure: X-axis = Years of tenure, Y-axis = Number of customers, Line shows trend, Area under line shows cumulative customer base
- How to interpret: A downward sloping line indicates customer churn over time. Steeper drops = higher churn at that tenure point. Area fill visually emphasizes the customer base size
- Dont make your own assumptions or calculations - use only the numbers provided above. If a percentage is not provided, do not calculate it yourself. Use the exact numbers from the data above in your analysis.

EXACT DATA FROM THIS CHART (points on the line):
${chartData.map((d) => `- Year ${d.years}: ${d.customers} customers (point on line)`).join("\n")}

KEY METRICS FROM THE LINE:
- Starting point (Year ${firstYear.years}): ${firstYear.customers} customers
- Peak point (Year ${peakYear.years}): ${peakYear.customers} customers (${yearsToPeak} year${yearsToPeak !== 1 ? "s" : ""} after start)
- Ending point (Year ${lastYear.years}): ${lastYear.customers} customers
- Total decline from start to end: ${totalDrop} customers (${dropOffPercent}% drop)

SENTENCE STRUCTURE TO FOLLOW (write exactly 5 sentences):

Sentence 1 - LINE DESCRIPTION: "The tenure decay line starts at ${firstYear.customers} customers in Year ${firstYear.years}, peaks at ${peakYear.customers} in Year ${peakYear.years}, and ends at ${lastYear.customers} in Year ${lastYear.years}."

Sentence 2 - DROP-OFF POINT: "The steepest drop in the line occurs between Year X and Year Y, where the company loses approximately [number] customers, representing the critical churn period."

Sentence 3 - CRITICAL MILESTONE: "The ${peakYear.years}-year mark is a critical retention milestone because customers who reach this point are 3x more likely to stay long-term."

Sentence 4 - IMMEDIATE ACTION FOR THE DROP: "This week, launch targeted retention campaigns specifically for customers approaching the [drop-off year]-year mark, including personalized outreach and special offers."

Sentence 5 - STRATEGIC INTERVENTION: "Over the next quarter, redesign the customer journey to add engagement touchpoints at months 3, 6, 12, and ${peakYear.years * 12} to flatten the decay curve and increase lifetime value."

Now write your analysis following this exact structure, using the exact numbers from the data points above. Reference the line, the area fill, and specific years where the line changes direction.`;
  } else if (chartType === "Service Life") {
    const sorted = [...chartData].sort((a, b) => b.avg_tenure - a.avg_tenure);
    const longest = sorted[0];
    const shortest = sorted[sorted.length - 1];
    const avgTenure = (
      chartData.reduce((sum, d) => sum + d.avg_tenure, 0) / chartData.length
    ).toFixed(1);
    const gap = (longest.avg_tenure - shortest.avg_tenure).toFixed(1);
    const aboveAvg = sorted.filter((s) => s.avg_tenure > parseFloat(avgTenure));
    const belowAvg = sorted.filter((s) => s.avg_tenure < parseFloat(avgTenure));

    contextPrompt = `CHART INFORMATION:
- Chart Name: "Service Longevity - Vertical Bar Chart"
- Chart Type: Vertical Bar Chart (each bar is a different color)
- What it shows: Average customer tenure in months for each internet service type
- Data Structure: X-axis = Service types, Y-axis = Average tenure in months, Each bar has unique color
- How to interpret: Taller bars = longer customer relationships. Colors help distinguish services. Compare bar heights to see which services retain customers longest
- Dont make your own assumptions or calculations - use only the numbers provided above. If a percentage is not provided, do not calculate it yourself. Use the exact numbers from the data above in your analysis.

EXACT DATA FROM THIS CHART (bar heights):
${chartData.map((d) => `- ${d.service}: ${d.avg_tenure.toFixed(1)} months (${d.service === longest.service ? "TALLEST BAR" : d.service === shortest.service ? "SHORTEST BAR" : "middle bar"})`).join("\n")}

KEY METRICS FROM BAR HEIGHTS:
- Tallest bar: ${longest.service} at ${longest.avg_tenure.toFixed(1)} months
- Shortest bar: ${shortest.service} at ${shortest.avg_tenure.toFixed(1)} months
- Average bar height across all services: ${avgTenure} months
- Gap between tallest and shortest bars: ${gap} months
- Bars above average: ${aboveAvg.map((s) => s.service).join(", ") || "none"} (${aboveAvg.length} services)
- Bars below average: ${belowAvg.map((s) => s.service).join(", ") || "none"} (${belowAvg.length} services)

SENTENCE STRUCTURE TO FOLLOW (write exactly 5 sentences):

Sentence 1 - BAR HEIGHT COMPARISON: "The tallest bar is ${longest.service} at ${longest.avg_tenure.toFixed(1)} months, while the shortest bar is ${shortest.service} at ${shortest.avg_tenure.toFixed(1)} months - a gap of ${gap} months."

Sentence 2 - AVERAGE CONTEXT: "The average bar height across all services is ${avgTenure} months, with ${aboveAvg.length} service(s) above average and ${belowAvg.length} service(s) below average."

Sentence 3 - WHY THE TALLEST BAR WINS: "${longest.service} retains customers longer because [choose one: it offers the best value / has superior reliability / provides better support / has competitive pricing], as shown by its ${longest.avg_tenure.toFixed(1)}-month bar."

Sentence 4 - WHY THE SHORTEST BAR FAILS: "${shortest.service} has the shortest customer lifespan at only ${shortest.avg_tenure.toFixed(1)} months due to [choose one: reliability issues / high cost / poor customer service / limited features]."

Sentence 5 - ACTIONABLE RECOMMENDATION: "Immediately audit ${shortest.service}'s customer experience, replicate ${longest.service}'s retention playbook, and set a goal to raise ${shortest.service}'s bar height to at least ${avgTenure} months within 6 months."

Now write your analysis following this exact structure, using the exact numbers from the bar heights above. Always refer to "tallest bar" and "shortest bar" when describing the extremes.`;
  }

  try {
    // Using Google GenAI SDK with gemini-3-flash-preview
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a senior customer intelligence analyst. ${contextPrompt}

IMPORTANT RULES:
1. Use ONLY the exact numbers provided in the data above
2. Do NOT calculate percentages unless the calculation is shown in the data
3. Do NOT invent numbers or make assumptions
4. Keep each sentence clear, specific, and actionable
5. Always refer to the chart elements (bars, slices, line, segments) by their colors or positions
6. If a number seems off, use the exact number from the data
7. Write exactly 5 sentences - no more, no less
8. Do not add introductory phrases like "Here is my analysis" - go straight into the sentences

Now write your analysis:`,
    });

    const aiText = response.text;
    console.log(`✅ AI Response for ${chartType}:`, aiText);

    return (
      aiText ||
      "Unable to generate AI insights at this moment. Please try again."
    );
  } catch (error) {
    console.error(`❌ API Error for ${chartType}:`, error);
    return `Unable to analyze ${chartType} chart at this moment. Error: ${error.message}`;
  }
};

// Donut Chart Component
const DonutChart = ({ data, width = 500, height = 400 }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const w = width;
    const h = height;
    const radius = Math.min(w, h) / 2.2;
    const innerRadius = radius * 0.6;

    const pie = d3
      .pie()
      .value((d) => d.value)
      .sort(null);
    const arc = d3.arc().innerRadius(innerRadius).outerRadius(radius);
    const labelArc = d3
      .arc()
      .innerRadius(radius * 0.85)
      .outerRadius(radius * 0.85);

    const color = d3
      .scaleOrdinal()
      .domain(data.map((d) => d.status))
      .range([RED, GREEN]);

    const g = svg
      .append("g")
      .attr("transform", `translate(${w / 2}, ${h / 2})`);

    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "d3-tooltip")
      .style("opacity", 0);

    const arcs = g
      .selectAll("arc")
      .data(pie(data))
      .enter()
      .append("g")
      .on("mouseover", function (event, d) {
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip
          .html(
            `${d.data.status}: ${d.data.value} customers (${((d.data.value / d3.sum(data, (d) => d.value)) * 100).toFixed(1)}%)`,
          )
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
        d3.select(this)
          .select("path")
          .transition()
          .duration(200)
          .attr("transform", "scale(1.05)");
      })
      .on("mouseout", function () {
        tooltip.transition().duration(500).style("opacity", 0);
        d3.select(this)
          .select("path")
          .transition()
          .duration(200)
          .attr("transform", "scale(1)");
      });

    arcs
      .append("path")
      .attr("d", arc)
      .attr("fill", (d) => color(d.data.status))
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .attr("cursor", "pointer")
      .transition()
      .duration(750)
      .attrTween("d", function (d) {
        const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return function (t) {
          return arc(interpolate(t));
        };
      });

    arcs
      .append("text")
      .attr("transform", (d) => `translate(${labelArc.centroid(d)})`)
      .attr("dy", ".35em")
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "700")
      .style("fill", "white")
      .text(
        (d) =>
          `${((d.data.value / d3.sum(data, (d) => d.value)) * 100).toFixed(0)}%`,
      );

    return () => tooltip.remove();
  }, [data, width, height]);

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      style={{ background: "transparent" }}
    />
  );
};

// Pie Chart Component (Loyalty)
const PieChartComponent = ({ data, width = 500, height = 400 }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const w = width;
    const h = height;
    const radius = Math.min(w, h) / 2.2;

    const pie = d3
      .pie()
      .value((d) => d.value)
      .sort(null);
    const arc = d3.arc().innerRadius(0).outerRadius(radius);

    const color = d3
      .scaleOrdinal()
      .domain(data.map((d) => d.type))
      .range([GREEN, RED]);

    const g = svg
      .append("g")
      .attr("transform", `translate(${w / 2}, ${h / 2})`);

    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "d3-tooltip")
      .style("opacity", 0);

    const arcs = g
      .selectAll("arc")
      .data(pie(data))
      .enter()
      .append("g")
      .on("mouseover", function (event, d) {
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip
          .html(
            `${d.data.type}: ${d.data.value} customers (${((d.data.value / d3.sum(data, (d) => d.value)) * 100).toFixed(1)}%)`,
          )
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
        d3.select(this)
          .select("path")
          .transition()
          .duration(200)
          .attr("transform", "scale(1.05)");
      })
      .on("mouseout", function () {
        tooltip.transition().duration(500).style("opacity", 0);
        d3.select(this)
          .select("path")
          .transition()
          .duration(200)
          .attr("transform", "scale(1)");
      });

    arcs
      .append("path")
      .attr("d", arc)
      .attr("fill", (d) => color(d.data.type))
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .attr("cursor", "pointer")
      .transition()
      .duration(750)
      .attrTween("d", function (d) {
        const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return function (t) {
          return arc(interpolate(t));
        };
      });

    arcs
      .append("text")
      .attr("transform", (d) => `translate(${arc.centroid(d)})`)
      .attr("dy", ".35em")
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "700")
      .style("fill", "white")
      .text(
        (d) =>
          `${((d.data.value / d3.sum(data, (d) => d.value)) * 100).toFixed(0)}%`,
      );

    return () => tooltip.remove();
  }, [data, width, height]);

  return <svg ref={svgRef} width={width} height={height} />;
};

// SIDE BY SIDE Bar Chart - Retention (Purple) vs Churn (Orange)
const RetentionVsChurnSideBySide = ({ data, width = 500, height = 400 }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 50, right: 50, bottom: 60, left: 70 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const chartData = data.map((d) => ({
      service: d.service,
      retained: 100 - d.avg_churn,
      churned: d.avg_churn,
    }));

    chartData.sort((a, b) => b.retained - a.retained);

    const xScale = d3
      .scaleBand()
      .domain(chartData.map((d) => d.service))
      .range([0, w])
      .padding(0.3);

    const subGroupScale = d3
      .scaleBand()
      .domain(["Retained", "Churned"])
      .range([0, xScale.bandwidth()])
      .padding(0.1);

    const yScale = d3.scaleLinear().domain([0, 100]).range([h, 0]).nice();

    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "d3-tooltip")
      .style("opacity", 0);

    // Retained bars (Purple)
    chartData.forEach((d) => {
      g.append("rect")
        .attr("x", xScale(d.service) + subGroupScale("Retained"))
        .attr("y", yScale(d.retained))
        .attr("width", subGroupScale.bandwidth())
        .attr("height", h - yScale(d.retained))
        .attr("fill", PURPLE)
        .attr("rx", 4)
        .attr("cursor", "pointer")
        .on("mouseover", function (event) {
          tooltip.transition().duration(200).style("opacity", 0.9);
          tooltip
            .html(`${d.service}<br/>Retained: ${d.retained.toFixed(1)}%`)
            .style("left", event.pageX + 10 + "px")
            .style("top", event.pageY - 28 + "px");
          d3.select(this).transition().duration(200).attr("opacity", 0.8);
        })
        .on("mouseout", function () {
          tooltip.transition().duration(500).style("opacity", 0);
          d3.select(this).transition().duration(200).attr("opacity", 1);
        });

      // Churned bars (Orange)
      g.append("rect")
        .attr("x", xScale(d.service) + subGroupScale("Churned"))
        .attr("y", yScale(d.churned))
        .attr("width", subGroupScale.bandwidth())
        .attr("height", h - yScale(d.churned))
        .attr("fill", ORANGE)
        .attr("rx", 4)
        .attr("cursor", "pointer")
        .on("mouseover", function (event) {
          tooltip.transition().duration(200).style("opacity", 0.9);
          tooltip
            .html(`${d.service}<br/>Churned: ${d.churned.toFixed(1)}%`)
            .style("left", event.pageX + 10 + "px")
            .style("top", event.pageY - 28 + "px");
          d3.select(this).transition().duration(200).attr("opacity", 0.8);
        })
        .on("mouseout", function () {
          tooltip.transition().duration(500).style("opacity", 0);
          d3.select(this).transition().duration(200).attr("opacity", 1);
        });
    });

    // Add value labels
    chartData.forEach((d) => {
      // Retention label
      if (yScale(d.retained) > 20) {
        g.append("text")
          .attr(
            "x",
            xScale(d.service) +
              subGroupScale("Retained") +
              subGroupScale.bandwidth() / 2,
          )
          .attr("y", yScale(d.retained) - 5)
          .attr("text-anchor", "middle")
          .style("font-size", "11px")
          .style("font-weight", "700")
          .style("fill", PURPLE)
          .text(`${d.retained.toFixed(0)}%`);
      }

      // Churn label
      if (yScale(d.churned) > 20) {
        g.append("text")
          .attr(
            "x",
            xScale(d.service) +
              subGroupScale("Churned") +
              subGroupScale.bandwidth() / 2,
          )
          .attr("y", yScale(d.churned) - 5)
          .attr("text-anchor", "middle")
          .style("font-size", "11px")
          .style("font-weight", "700")
          .style("fill", ORANGE)
          .text(`${d.churned.toFixed(0)}%`);
      }
    });

    // Axes
    g.append("g")
      .call(
        d3
          .axisLeft(yScale)
          .ticks(5)
          .tickFormat((d) => d + "%"),
      )
      .style("font-size", "11px");

    g.append("g")
      .attr("transform", `translate(0, ${h})`)
      .call(d3.axisBottom(xScale))
      .style("font-size", "11px")
      .style("font-weight", "600");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -h / 2)
      .attr("y", -50)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("fill", GRAY)
      .text("Percentage (%)");

    // Title
    g.append("text")
      .attr("x", w / 2)
      .attr("y", -20)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "700")
      .style("fill", PURPLE_DARK)
      .text("Customer Retention vs Churn by Service");

    return () => tooltip.remove();
  }, [data, width, height]);

  return <svg ref={svgRef} width={width} height={height} />;
};

// STACKED BAR Sentiment Chart
const SentimentStackedChart = ({ data, width = 500, height = 400 }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 60, right: 30, bottom: 60, left: 70 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Prepare data
    const positive = data.find((d) => d.sentiment === "Positive")?.value || 0;
    const neutral = data.find((d) => d.sentiment === "Neutral")?.value || 0;
    const negative = data.find((d) => d.sentiment === "Negative")?.value || 0;
    const total = positive + neutral + negative;

    const stackedData = [
      { sentiment: "Sentiment Distribution", positive, neutral, negative },
    ];

    const xScale = d3
      .scaleBand()
      .domain(stackedData.map((d) => d.sentiment))
      .range([0, w])
      .padding(0.4);

    const yScale = d3.scaleLinear().domain([0, total]).range([h, 0]).nice();

    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "d3-tooltip")
      .style("opacity", 0);

    const d = stackedData[0];
    let yOffset = 0;

    // Positive segment (bottom)
    if (d.positive > 0) {
      const barHeight = h - yScale(d.positive);
      g.append("rect")
        .attr("x", xScale(d.sentiment))
        .attr("y", yScale(d.positive))
        .attr("width", xScale.bandwidth())
        .attr("height", barHeight)
        .attr("fill", GREEN)
        .attr("cursor", "pointer")
        .on("mouseover", function (event) {
          const percentage = ((d.positive / total) * 100).toFixed(1);
          tooltip.transition().duration(200).style("opacity", 0.9);
          tooltip
            .html(
              `😊 Positive<br/>Count: ${d.positive} customers<br/>Percentage: ${percentage}%`,
            )
            .style("left", event.pageX + 10 + "px")
            .style("top", event.pageY - 28 + "px");
          d3.select(this).transition().duration(200).attr("opacity", 0.85);
        })
        .on("mouseout", function () {
          tooltip.transition().duration(500).style("opacity", 0);
          d3.select(this).transition().duration(200).attr("opacity", 1);
        });

      // Label
      if (barHeight > 30) {
        g.append("text")
          .attr("x", xScale(d.sentiment) + xScale.bandwidth() / 2)
          .attr("y", yScale(d.positive) + barHeight / 2)
          .attr("text-anchor", "middle")
          .attr("dy", ".35em")
          .style("font-size", "13px")
          .style("font-weight", "700")
          .style("fill", "white")
          .text(`${d.positive} (${((d.positive / total) * 100).toFixed(0)}%)`);
      }
      yOffset = d.positive;
    }

    // Neutral segment (middle)
    if (d.neutral > 0) {
      const barHeight = h - yScale(d.neutral);
      g.append("rect")
        .attr("x", xScale(d.sentiment))
        .attr("y", yScale(yOffset + d.neutral))
        .attr("width", xScale.bandwidth())
        .attr("height", barHeight)
        .attr("fill", YELLOW)
        .attr("cursor", "pointer")
        .on("mouseover", function (event) {
          const percentage = ((d.neutral / total) * 100).toFixed(1);
          tooltip.transition().duration(200).style("opacity", 0.9);
          tooltip
            .html(
              `😐 Neutral<br/>Count: ${d.neutral} customers<br/>Percentage: ${percentage}%`,
            )
            .style("left", event.pageX + 10 + "px")
            .style("top", event.pageY - 28 + "px");
          d3.select(this).transition().duration(200).attr("opacity", 0.85);
        })
        .on("mouseout", function () {
          tooltip.transition().duration(500).style("opacity", 0);
          d3.select(this).transition().duration(200).attr("opacity", 1);
        });

      // Label
      if (barHeight > 30) {
        g.append("text")
          .attr("x", xScale(d.sentiment) + xScale.bandwidth() / 2)
          .attr("y", yScale(yOffset + d.neutral) + barHeight / 2)
          .attr("text-anchor", "middle")
          .attr("dy", ".35em")
          .style("font-size", "13px")
          .style("font-weight", "700")
          .style("fill", "white")
          .text(`${d.neutral} (${((d.neutral / total) * 100).toFixed(0)}%)`);
      }
      yOffset += d.neutral;
    }

    // Negative segment (top)
    if (d.negative > 0) {
      const barHeight = h - yScale(d.negative);
      g.append("rect")
        .attr("x", xScale(d.sentiment))
        .attr("y", yScale(yOffset + d.negative))
        .attr("width", xScale.bandwidth())
        .attr("height", barHeight)
        .attr("fill", RED)
        .attr("cursor", "pointer")
        .on("mouseover", function (event) {
          const percentage = ((d.negative / total) * 100).toFixed(1);
          tooltip.transition().duration(200).style("opacity", 0.9);
          tooltip
            .html(
              `😞 Negative<br/>Count: ${d.negative} customers<br/>Percentage: ${percentage}%`,
            )
            .style("left", event.pageX + 10 + "px")
            .style("top", event.pageY - 28 + "px");
          d3.select(this).transition().duration(200).attr("opacity", 0.85);
        })
        .on("mouseout", function () {
          tooltip.transition().duration(500).style("opacity", 0);
          d3.select(this).transition().duration(200).attr("opacity", 1);
        });

      // Label
      if (barHeight > 30) {
        g.append("text")
          .attr("x", xScale(d.sentiment) + xScale.bandwidth() / 2)
          .attr("y", yScale(yOffset + d.negative) + barHeight / 2)
          .attr("text-anchor", "middle")
          .attr("dy", ".35em")
          .style("font-size", "13px")
          .style("font-weight", "700")
          .style("fill", "white")
          .text(`${d.negative} (${((d.negative / total) * 100).toFixed(0)}%)`);
      }
    }

    // Axes
    g.append("g").call(d3.axisLeft(yScale).ticks(6)).style("font-size", "11px");

    g.append("g")
      .attr("transform", `translate(0, ${h})`)
      .call(d3.axisBottom(xScale))
      .style("font-size", "12px")
      .style("font-weight", "600");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -h / 2)
      .attr("y", -45)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("fill", GRAY)
      .text("Number of Customers");

    // Legend
    const legendY = -35;
    const legendData = [
      { label: "Positive 😊", color: GREEN, x: 0 },
      { label: "Neutral 😐", color: YELLOW, x: 100 },
      { label: "Negative 😞", color: RED, x: 200 },
    ];

    legendData.forEach((item) => {
      g.append("rect")
        .attr("x", item.x)
        .attr("y", legendY)
        .attr("width", 14)
        .attr("height", 14)
        .attr("fill", item.color)
        .attr("rx", 3);
      g.append("text")
        .attr("x", item.x + 20)
        .attr("y", legendY + 11)
        .style("font-size", "11px")
        .style("font-weight", "600")
        .style("fill", GRAY)
        .text(item.label);
    });

    g.append("text")
      .attr("x", w / 2)
      .attr("y", -45)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "700")
      .style("fill", PURPLE_DARK)
      .text(`Sentiment Distribution (Total: ${total})`);

    return () => tooltip.remove();
  }, [data, width, height]);

  return <svg ref={svgRef} width={width} height={height} />;
};

// Null vs Not Null Chart (No Feedback = RED)
const NullVsNotNullChart = ({
  data,
  width = 500,
  height = 400,
  totalCustomers = 0,
}) => {
  const svgRef = useRef();

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 60, right: 30, bottom: 60, left: 70 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const totalFeedback = data.reduce((sum, d) => sum + d.value, 0);
    const noFeedback = Math.max(0, totalCustomers - totalFeedback);

    const chartData = [
      { type: "Has Feedback", value: totalFeedback, color: GREEN },
      { type: "No Feedback", value: noFeedback, color: RED },
    ];

    const xScale = d3
      .scaleBand()
      .domain(chartData.map((d) => d.type))
      .range([0, w])
      .padding(0.3);

    const yScale = d3
      .scaleLinear()
      .domain([0, totalCustomers])
      .range([h, 0])
      .nice();

    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "d3-tooltip")
      .style("opacity", 0);

    chartData.forEach((d) => {
      g.append("rect")
        .attr("x", xScale(d.type))
        .attr("y", yScale(d.value))
        .attr("width", xScale.bandwidth())
        .attr("height", h - yScale(d.value))
        .attr("fill", d.color)
        .attr("rx", 8)
        .attr("cursor", "pointer")
        .on("mouseover", function (event) {
          const percentage = ((d.value / totalCustomers) * 100).toFixed(1);
          tooltip.transition().duration(200).style("opacity", 0.9);
          tooltip
            .html(
              `${d.type}<br/>Count: ${d.value} customers<br/>Percentage: ${percentage}%`,
            )
            .style("left", event.pageX + 10 + "px")
            .style("top", event.pageY - 28 + "px");
          d3.select(this).transition().duration(200).attr("opacity", 0.8);
        })
        .on("mouseout", function () {
          tooltip.transition().duration(500).style("opacity", 0);
          d3.select(this).transition().duration(200).attr("opacity", 1);
        });
    });

    chartData.forEach((d) => {
      if (d.value > 0 && yScale(d.value) > 10) {
        g.append("text")
          .attr("x", xScale(d.type) + xScale.bandwidth() / 2)
          .attr("y", yScale(d.value) - 8)
          .attr("text-anchor", "middle")
          .style("font-size", "14px")
          .style("font-weight", "700")
          .style("fill", d.color)
          .text(d.value);
      }
    });

    g.append("g").call(d3.axisLeft(yScale).ticks(6)).style("font-size", "11px");

    g.append("g")
      .attr("transform", `translate(0, ${h})`)
      .call(d3.axisBottom(xScale))
      .style("font-size", "12px")
      .style("font-weight", "600");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -h / 2)
      .attr("y", -45)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("fill", GRAY)
      .text("Number of Customers");

    g.append("text")
      .attr("x", w / 2)
      .attr("y", -25)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "700")
      .style("fill", PURPLE_DARK)
      .text(
        `Feedback Completion: ${((totalFeedback / totalCustomers) * 100).toFixed(1)}%`,
      );

    return () => tooltip.remove();
  }, [data, width, height, totalCustomers]);

  return <svg ref={svgRef} width={width} height={height} />;
};

// Service Longevity Chart - Each bar different color
const ServiceLongevityChart = ({ data, width = 500, height = 400 }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 50, right: 30, bottom: 60, left: 70 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3
      .scaleBand()
      .domain(data.map((d) => d.service))
      .range([0, w])
      .padding(0.3);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.avg_tenure) * 1.1])
      .range([h, 0])
      .nice();

    const colorPalette = [
      PURPLE,
      BLUE,
      TEAL,
      INDIGO,
      PINK,
      ORANGE,
      GREEN,
      YELLOW,
    ];

    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "d3-tooltip")
      .style("opacity", 0);

    data.forEach((d, i) => {
      g.append("rect")
        .attr("x", xScale(d.service))
        .attr("y", yScale(d.avg_tenure))
        .attr("width", xScale.bandwidth())
        .attr("height", h - yScale(d.avg_tenure))
        .attr("fill", colorPalette[i % colorPalette.length])
        .attr("rx", 8)
        .attr("cursor", "pointer")
        .on("mouseover", function (event) {
          tooltip.transition().duration(200).style("opacity", 0.9);
          tooltip
            .html(
              `${d.service}<br/>Avg Tenure: ${d.avg_tenure.toFixed(1)} months`,
            )
            .style("left", event.pageX + 10 + "px")
            .style("top", event.pageY - 28 + "px");
          d3.select(this).transition().duration(200).attr("opacity", 0.8);
        })
        .on("mouseout", function () {
          tooltip.transition().duration(500).style("opacity", 0);
          d3.select(this).transition().duration(200).attr("opacity", 1);
        });

      g.append("text")
        .attr("x", xScale(d.service) + xScale.bandwidth() / 2)
        .attr("y", yScale(d.avg_tenure) - 8)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("font-weight", "700")
        .style("fill", colorPalette[i % colorPalette.length])
        .text(d.avg_tenure.toFixed(1));
    });

    g.append("g").call(d3.axisLeft(yScale).ticks(6)).style("font-size", "11px");

    g.append("g")
      .attr("transform", `translate(0, ${h})`)
      .call(d3.axisBottom(xScale))
      .style("font-size", "11px")
      .style("font-weight", "600");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -h / 2)
      .attr("y", -45)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("fill", GRAY)
      .text("Average Tenure (Months)");

    g.append("text")
      .attr("x", w / 2)
      .attr("y", -20)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "700")
      .style("fill", PURPLE_DARK)
      .text("Customer Longevity by Service Type");

    return () => tooltip.remove();
  }, [data, width, height]);

  return <svg ref={svgRef} width={width} height={height} />;
};

// Line Chart Component
const LineChartComponent = ({ data, width = 500, height = 400 }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 40, right: 30, bottom: 50, left: 70 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3
      .scaleLinear()
      .domain(d3.extent(data, (d) => d.years))
      .range([0, w]);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.customers) * 1.1])
      .range([h, 0])
      .nice();

    const line = d3
      .line()
      .x((d) => xScale(d.years))
      .y((d) => yScale(d.customers))
      .curve(d3.curveMonotoneX);

    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "d3-tooltip")
      .style("opacity", 0);

    g.append("path")
      .datum(data)
      .attr("fill", PURPLE)
      .attr("fill-opacity", 0.15)
      .attr(
        "d",
        d3
          .area()
          .x((d) => xScale(d.years))
          .y0(yScale(0))
          .y1((d) => yScale(d.customers)),
      );

    g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", PURPLE)
      .attr("stroke-width", 3)
      .attr("d", line);

    g.selectAll(".dot")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", (d) => xScale(d.years))
      .attr("cy", (d) => yScale(d.customers))
      .attr("r", 6)
      .attr("fill", PURPLE_DARK)
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .attr("cursor", "pointer")
      .on("mouseover", function (event, d) {
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip
          .html(`Year ${d.years}<br/>Customers: ${d.customers}`)
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
        d3.select(this).transition().duration(200).attr("r", 8);
      })
      .on("mouseout", function () {
        tooltip.transition().duration(500).style("opacity", 0);
        d3.select(this).transition().duration(200).attr("r", 6);
      });

    g.append("g").call(d3.axisLeft(yScale).ticks(6)).style("font-size", "11px");

    g.append("g")
      .attr("transform", `translate(0, ${h})`)
      .call(d3.axisBottom(xScale).ticks(data.length))
      .style("font-size", "11px");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -h / 2)
      .attr("y", -45)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("fill", GRAY)
      .text("Number of Customers");

    g.append("text")
      .attr("x", w / 2)
      .attr("y", h + 40)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("fill", GRAY)
      .text("Years");

    return () => tooltip.remove();
  }, [data, width, height]);

  return <svg ref={svgRef} width={width} height={height} />;
};

const Dashboard = () => {
  const [data, setData] = useState({
    risk: [],
    churn: [],
    services: [],
    sentiment: [],
    loyalty: [],
    tenure: [],
    serviceLife: [],
  });
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [sentimentView, setSentimentView] = useState("sentiment");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedChart, setSelectedChart] = useState(null);
  const [aiResponse, setAiResponse] = useState("");
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [showAI, setShowAI] = useState(false);

  useEffect(() => {
    fetch("http://localhost:5000/dashboard")
      .then((res) => res.json())
      .then((res) => {
        setData(res);
        setTotalCustomers(res.totalCustomers || 0);
      })
      .catch((err) => console.error(err));
  }, []);

  const handleCardClick = async (chartType, chartData, chartTitle) => {
    setSelectedChart({ type: chartType, data: chartData, title: chartTitle });
    setModalOpen(true);
    setIsLoadingAI(true);
    setAiResponse("");

    const insight = await callGeminiAPI(chartType, chartData, chartTitle);
    setAiResponse(insight);
    setIsLoadingAI(false);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedChart(null);
    setAiResponse("");
  };

  // Updated labels: "At Risk" -> "Average"
  const getRiskLabel = (segment) => {
    if (segment === "At Risk") return "Average";
    return segment;
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Customer Intelligence</h1>
        </div>
      </div>

      <div className="cta-banner">
        <span>
          Click any chart below for detailed AI-powered insights and
          recommendations
        </span>
      </div>

      <div className="cards">
        {data.risk.map((item, i) => (
          <div
            key={i}
            className="card"
            style={{
              borderTop: `4px solid ${[RED, ORANGE, YELLOW, GREEN][i]}`,
            }}
          >
            <h4>{getRiskLabel(item.segment)}</h4>
            <h2>{item.count}</h2>
            <div className="card-trend">
              {i === 0 && "🔴 Immediate Action Needed"}
              {i === 1 && "🟠 Requires Attention"}
              {i === 2 && "🟡 Monitor Closely"}
              {i === 3 && "🟢 Stable"}
            </div>
          </div>
        ))}
      </div>

      {/* Row 1 */}
      <div className="row">
        <div
          className="chart-card clickable"
          onClick={() =>
            handleCardClick("Churn vs Not Churn", data.churn, "Churn Analysis")
          }
        >
          <h3>Churn vs Retention</h3>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              minHeight: "350px",
            }}
          >
            <DonutChart data={data.churn} width={450} height={350} />
          </div>
        </div>

        <div
          className="chart-card clickable"
          onClick={() =>
            handleCardClick(
              "Retention vs Churn",
              data.services,
              "Retention vs Churn by Service",
            )
          }
        >
          <h3>Retention vs Churn by Service</h3>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              minHeight: "350px",
            }}
          >
            <RetentionVsChurnSideBySide
              data={data.services}
              width={450}
              height={350}
            />
          </div>
        </div>
      </div>

      {/* Row 2 */}
      <div className="row">
        <div className="chart-card">
          <div className="chart-header">
            <h3>Customer Sentiment Analysis</h3>
            <div className="toggle-group">
              <button
                className={`toggle-btn ${sentimentView === "sentiment" ? "active" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSentimentView("sentiment");
                }}
              >
                😊 Sentiment Distribution
              </button>
              <button
                className={`toggle-btn ${sentimentView === "nullcheck" ? "active" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSentimentView("nullcheck");
                }}
              >
                📊 Feedback Coverage
              </button>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              minHeight: "350px",
              cursor: "pointer",
            }}
            onClick={() =>
              handleCardClick("Sentiment", data.sentiment, "Sentiment Analysis")
            }
          >
            {sentimentView === "sentiment" ? (
              <SentimentStackedChart
                data={data.sentiment}
                width={450}
                height={350}
              />
            ) : (
              <NullVsNotNullChart
                data={data.sentiment}
                width={450}
                height={350}
                totalCustomers={totalCustomers}
              />
            )}
          </div>
        </div>

        <div
          className="chart-card clickable"
          onClick={() =>
            handleCardClick("Loyalty", data.loyalty, "Loyalty Analysis")
          }
        >
          <h3>Loyalty Status</h3>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              minHeight: "350px",
            }}
          >
            <PieChartComponent data={data.loyalty} width={450} height={350} />
          </div>
        </div>
      </div>

      {/* Row 3 */}
      <div className="row">
        <div
          className="chart-card clickable"
          onClick={() =>
            handleCardClick(
              "Tenure",
              data.tenure,
              "Customer Tenure Distribution",
            )
          }
        >
          <h3>Tenure Decay Curve</h3>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              minHeight: "350px",
            }}
          >
            <LineChartComponent data={data.tenure} width={450} height={350} />
          </div>
        </div>

        <div
          className="chart-card clickable"
          onClick={() =>
            handleCardClick(
              "Service Life",
              data.serviceLife,
              "Service Longevity Analysis",
            )
          }
        >
          <h3>Service Longevity (Months)</h3>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              minHeight: "350px",
            }}
          >
            <ServiceLongevityChart
              data={data.serviceLife}
              width={450}
              height={350}
            />
          </div>
        </div>
      </div>

      {modalOpen && selectedChart && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📊 {selectedChart.title}</h2>
              <button className="modal-close" onClick={closeModal}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-chart">
                {selectedChart.type === "Churn vs Not Churn" && (
                  <DonutChart
                    data={selectedChart.data}
                    width={700}
                    height={450}
                  />
                )}
                {selectedChart.type === "Retention vs Churn" && (
                  <RetentionVsChurnSideBySide
                    data={selectedChart.data}
                    width={700}
                    height={450}
                  />
                )}
                {selectedChart.type === "Sentiment" &&
                  (sentimentView === "sentiment" ? (
                    <SentimentStackedChart
                      data={selectedChart.data}
                      width={700}
                      height={450}
                    />
                  ) : (
                    <NullVsNotNullChart
                      data={selectedChart.data}
                      width={700}
                      height={450}
                      totalCustomers={totalCustomers}
                    />
                  ))}
                {selectedChart.type === "Loyalty" && (
                  <PieChartComponent
                    data={selectedChart.data}
                    width={700}
                    height={450}
                  />
                )}
                {selectedChart.type === "Tenure" && (
                  <LineChartComponent
                    data={selectedChart.data}
                    width={700}
                    height={450}
                  />
                )}
                {selectedChart.type === "Service Life" && (
                  <ServiceLongevityChart
                    data={selectedChart.data}
                    width={700}
                    height={450}
                  />
                )}
              </div>

              <div className="modal-ai-section">
                <div className="modal-ai-icon"></div>
                <div className="modal-ai-text">
                  <div className="ai-dropdown">
                    <div
                      className="ai-dropdown-header"
                      onClick={() => setShowAI(!showAI)}
                    >
                      <h4>AI-Powered Insights (Gemini 3 Flash)</h4>
                      <span className={`arrow ${showAI ? "open" : ""}`}>⌄</span>
                    </div>

                    <div
                      className={`ai-dropdown-content ${showAI ? "open" : ""}`}
                    >
                      {isLoadingAI ? (
                        <div className="ai-loading-modal">
                          <span>
                            Analyzing patterns and generating insights
                          </span>
                          <div className="dot-pulse"></div>
                        </div>
                      ) : (
                        <p className="ai-response-text">
                          {aiResponse || "Generating comprehensive analysis..."}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-action">
                <button className="cta-button" onClick={closeModal}>
                  Close Analysis
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
