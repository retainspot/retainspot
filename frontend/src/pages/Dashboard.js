// Dashboard.jsx — Layout matches screenshot exactly
import React, { useEffect, useState, useRef } from "react";
import * as d3 from "d3";
import "./Dashboard.css";
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

const PURPLE = "#7c3aed";
const ORANGE = "#f97316"; 
const GREEN = "#10b981";
const RED = "#ef4444";
const BLUE = "#3b82f6";
const YELLOW = "#fbbf24";
const TEAL = "#14b8a6";
const INDIGO = "#6366f1";
const PINK = "#ec4899";

// ========== CLAUDE AI ==========
const callClaudeAPI = async (chartType, chartData, chartTitle) => {
  let contextPrompt = "";
  if (chartType === "Churn vs Not Churn") {
    const churned = chartData.find((d) => d.status === "Churn")?.value || 0;
    const retained = chartData.find((d) => d.status === "Not Churn")?.value || 0;
    const total = churned + retained;
    const churnRate = ((churned / total) * 100).toFixed(1);
    contextPrompt = `Churn vs Retention Donut. Churned: ${churned} (${churnRate}%), Retained: ${retained} (${(100 - churnRate).toFixed(1)}%), Total: ${total}. Write exactly 5 actionable sentences.`;
  } else if (chartType === "Retention vs Churn") {
    const sd = chartData.map((d) => ({ service: d.service, ret: (100 - d.avg_churn).toFixed(1), ch: d.avg_churn.toFixed(1) }));
    contextPrompt = `Retention vs Churn by Service. ${sd.map((s) => `${s.service}: ${s.ret}% retention, ${s.ch}% churn`).join("; ")}. Write exactly 5 actionable sentences.`;
  } else if (chartType === "Sentiment") {
    const p = chartData.find((d) => d.sentiment === "Positive")?.value || 0;
    const ne = chartData.find((d) => d.sentiment === "Negative")?.value || 0;
    const nu = chartData.find((d) => d.sentiment === "Neutral")?.value || 0;
    const t = p + ne + nu;
    contextPrompt = `Customer Sentiment. Positive: ${p} (${((p / t) * 100).toFixed(1)}%), Neutral: ${nu} (${((nu / t) * 100).toFixed(1)}%), Negative: ${ne} (${((ne / t) * 100).toFixed(1)}%), Total: ${t}. Write exactly 5 actionable sentences.`;
  } else if (chartType === "Loyalty") {
    const lo = chartData.find((d) => d.type === "Loyal")?.value || 0;
    const nl = chartData.find((d) => d.type === "Not Loyal")?.value || 0;
    const t = lo + nl;
    contextPrompt = `Loyalty Pie. Loyal: ${lo} (${((lo / t) * 100).toFixed(1)}%), Not Loyal: ${nl} (${((nl / t) * 100).toFixed(1)}%), Total: ${t}. Write exactly 5 actionable sentences.`;
  } else if (chartType === "Tenure") {
    const peak = chartData.reduce((mx, d) => d.customers > mx.customers ? d : mx, chartData[0]);
    contextPrompt = `Tenure Decay. Points: ${chartData.map((d) => `Year ${d.years}: ${d.customers}`).join(", ")}. Peak Year ${peak?.years} (${peak?.customers}). Write exactly 5 actionable sentences.`;
  } else if (chartType === "Service Life") {
    const sorted = [...chartData].sort((a, b) => b.avg_tenure - a.avg_tenure);
    contextPrompt = `Service Longevity. ${chartData.map((d) => `${d.service}: ${d.avg_tenure.toFixed(1)} mo`).join(", ")}. Best: ${sorted[0]?.service}, Worst: ${sorted[sorted.length - 1]?.service}. Write exactly 5 actionable sentences.`;
  }
  try {
    const res = await fetch(`${API_URL}/api/ai-insight`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: contextPrompt }),
    });

    const data = await res.json();
    return data.insight || "Unable to generate insights.";
  } catch (err) {
    return `Error: ${err.message}`;
  }
};

// ========== D3 CHARTS ==========
const DonutChart = ({ data, width = 300, height = 280 }) => {
  const svgRef = useRef();
  useEffect(() => {
    if (!data || !data.length) return;
    const svg = d3.select(svgRef.current)
      .attr("viewBox", `0 0 ${width} ${height}`) // Cho phép responsive
      .attr("preserveAspectRatio", "xMidYMid meet");
    
    svg.selectAll("*").remove();
    const r = Math.min(width, height) / 2.3, ir = r * 0.58;
    const pie = d3.pie().value((d) => d.value).sort(null);
    const arc = d3.arc().innerRadius(ir).outerRadius(r);
    const color = d3.scaleOrdinal().domain(data.map((d) => d.status)).range([RED, BLUE]);
    const g = svg.append("g").attr("transform", `translate(${width / 2},${height / 2})`);
    const tip = d3.select("body").append("div").attr("class", "d3-tooltip").style("opacity", 0);
    const total = d3.sum(data, d => d.value);
    const arcs = g.selectAll("arc").data(pie(data)).enter().append("g")
      .on("mouseover", function (ev, d) { tip.transition().duration(200).style("opacity", 0.9); tip.html(`${d.data.status}: ${d.data.value}<br/>${((d.data.value / total) * 100).toFixed(1)}%`).style("left", ev.pageX + 10 + "px").style("top", ev.pageY - 28 + "px"); d3.select(this).select("path").transition().attr("transform", "scale(1.05)"); })
      .on("mouseout", function () { tip.transition().duration(300).style("opacity", 0); d3.select(this).select("path").transition().attr("transform", "scale(1)"); });
    arcs.append("path").attr("d", arc).attr("fill", d => color(d.data.status)).attr("stroke", "white").attr("stroke-width", 2).attr("cursor", "pointer")
      .transition().duration(750).attrTween("d", function (d) { const i = d3.interpolate({ startAngle: 0, endAngle: 0 }, d); return t => arc(i(t)); });
    arcs.append("text").attr("transform", d => `translate(${arc.centroid(d)})`).attr("dy", ".35em").style("text-anchor", "middle").style("font-size", "13px").style("font-weight", "700").style("fill", "white")
      .text(d => `${((d.data.value / total) * 100).toFixed(0)}%`);
    return () => tip.remove();
  }, [data, width, height]);
  return <svg ref={svgRef} style={{ width: "100%", height: "auto", display: "block" }} />;
};

const PieChartD3 = ({ data, width = 300, height = 280 }) => {
  const svgRef = useRef();
  useEffect(() => {
    if (!data || !data.length) return;
    const svg = d3.select(svgRef.current)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");
    
    svg.selectAll("*").remove();
    const r = Math.min(width, height) / 2.3;
    const pie = d3.pie().value((d) => d.value).sort(null);
    const arc = d3.arc().innerRadius(0).outerRadius(r);
    const color = d3.scaleOrdinal().domain(data.map((d) => d.type)).range([BLUE, RED]);
    const g = svg.append("g").attr("transform", `translate(${width / 2},${height / 2})`);
    const tip = d3.select("body").append("div").attr("class", "d3-tooltip").style("opacity", 0);
    const total = d3.sum(data, d => d.value);
    const arcs = g.selectAll("arc").data(pie(data)).enter().append("g")
      .on("mouseover", function (ev, d) { tip.transition().duration(200).style("opacity", 0.9); tip.html(`${d.data.type}: ${d.data.value}<br/>${((d.data.value / total) * 100).toFixed(1)}%`).style("left", ev.pageX + 10 + "px").style("top", ev.pageY - 28 + "px"); d3.select(this).select("path").transition().attr("transform", "scale(1.05)"); })
      .on("mouseout", function () { tip.transition().duration(300).style("opacity", 0); d3.select(this).select("path").transition().attr("transform", "scale(1)"); });
    arcs.append("path").attr("d", arc).attr("fill", d => color(d.data.type)).attr("stroke", "white").attr("stroke-width", 2).attr("cursor", "pointer")
      .transition().duration(750).attrTween("d", function (d) { const i = d3.interpolate({ startAngle: 0, endAngle: 0 }, d); return t => arc(i(t)); });
    arcs.append("text").attr("transform", d => `translate(${arc.centroid(d)})`).attr("dy", ".35em").style("text-anchor", "middle").style("font-size", "13px").style("font-weight", "700").style("fill", "white")
      .text(d => `${((d.data.value / total) * 100).toFixed(0)}%`);
    return () => tip.remove();
  }, [data, width, height]);
  return <svg ref={svgRef} style={{ width: "100%", height: "auto", display: "block" }} />;
};

const RetentionBar = ({ data, width = 380, height = 260 }) => {
  const svgRef = useRef();
  useEffect(() => {
    if (!data || !data.length) return;
    const svg = d3.select(svgRef.current)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    svg.selectAll("*").remove();
    const m = { top: 20, right: 20, bottom: 50, left: 45 };
    const w = width - m.left - m.right, h = height - m.top - m.bottom;
    const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);
    const cd = data.map(d => ({ service: d.service, retained: 100 - d.avg_churn, churned: d.avg_churn })).sort((a, b) => b.retained - a.retained);
    const x0 = d3.scaleBand().domain(cd.map(d => d.service)).range([0, w]).padding(0.25);
    const x1 = d3.scaleBand().domain(["R", "C"]).range([0, x0.bandwidth()]).padding(0.08);
    const y = d3.scaleLinear().domain([0, 100]).range([h, 0]).nice();
    const tip = d3.select("body").append("div").attr("class", "d3-tooltip").style("opacity", 0);
    cd.forEach(d => {
      [{ k: "R", v: d.retained, col: PURPLE, lbl: "Retained" }, { k: "C", v: d.churned, col: ORANGE, lbl: "Churned" }].forEach(({ k, v, col, lbl }) => {
        g.append("rect").attr("x", x0(d.service) + x1(k)).attr("y", y(v)).attr("width", x1.bandwidth()).attr("height", h - y(v)).attr("fill", col).attr("rx", 4).attr("cursor", "pointer")
          .on("mouseover", function (ev) { tip.transition().duration(200).style("opacity", 0.9); tip.html(`${d.service}<br/>${lbl}: ${v.toFixed(1)}%`).style("left", ev.pageX + 10 + "px").style("top", ev.pageY - 28 + "px"); d3.select(this).transition().attr("opacity", 0.8); })
          .on("mouseout", function () { tip.transition().duration(300).style("opacity", 0); d3.select(this).transition().attr("opacity", 1); });
        if (h - y(v) > 18) g.append("text").attr("x", x0(d.service) + x1(k) + x1.bandwidth() / 2).attr("y", y(v) - 4).attr("text-anchor", "middle").style("font-size", "10px").style("font-weight", "700").style("fill", col).text(`${v.toFixed(0)}%`);
      });
    });
    g.append("g").call(d3.axisLeft(y).ticks(5).tickFormat(d => d + "%")).style("font-size", "10px");
    g.append("g").attr("transform", `translate(0,${h})`).call(d3.axisBottom(x0)).style("font-size", "10px");
    return () => tip.remove();
  }, [data, width, height]);
  return <svg ref={svgRef} style={{ width: "100%", height: "auto", display: "block" }} />;
};

const SentimentChart = ({ data, width = 320, height = 260 }) => {
  const svgRef = useRef();
  useEffect(() => {
    if (!data || !data.length) return;
    const svg = d3.select(svgRef.current)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    svg.selectAll("*").remove();
    const m = { top: 20, right: 20, bottom: 50, left: 55 };
    const w = width - m.left - m.right, h = height - m.top - m.bottom;
    const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);
    const pos = data.find(d => d.sentiment === "Positive")?.value || 0;
    const neu = data.find(d => d.sentiment === "Neutral")?.value || 0;
    const neg = data.find(d => d.sentiment === "Negative")?.value || 0;
    const total = pos + neu + neg;
    const x = d3.scaleBand().domain(["Sentiment"]).range([0, w]).padding(0.35);
    const y = d3.scaleLinear().domain([0, total]).range([h, 0]).nice();
    const tip = d3.select("body").append("div").attr("class", "d3-tooltip").style("opacity", 0);
    let off = 0;
    [{ v: pos, col: BLUE, lbl: "Positive" }, { v: neu, col: YELLOW, lbl: "Neutral" }, { v: neg, col: RED, lbl: "Negative" }].forEach(({ v, col, lbl }) => {
      if (v <= 0) return;
      const bh = h - y(v);
      g.append("rect").attr("x", x("Sentiment")).attr("y", y(off + v)).attr("width", x.bandwidth()).attr("height", bh).attr("fill", col).attr("cursor", "pointer")
        .on("mouseover", function (ev) { tip.transition().duration(200).style("opacity", 0.9); tip.html(`${lbl}<br/>${v} (${((v / total) * 100).toFixed(1)}%)`).style("left", ev.pageX + 10 + "px").style("top", ev.pageY - 28 + "px"); d3.select(this).transition().attr("opacity", 0.85); })
        .on("mouseout", function () { tip.transition().duration(300).style("opacity", 0); d3.select(this).transition().attr("opacity", 1); });
      if (bh > 25) g.append("text").attr("x", x("Sentiment") + x.bandwidth() / 2).attr("y", y(off + v) + bh / 2).attr("text-anchor", "middle").attr("dy", ".35em").style("font-size", "12px").style("font-weight", "700").style("fill", "white").text(`${v}`);
      off += v;
    });
    g.append("g").call(d3.axisLeft(y).ticks(5)).style("font-size", "10px");
    g.append("g").attr("transform", `translate(0,${h})`).call(d3.axisBottom(x)).style("font-size", "11px");
    return () => tip.remove();
  }, [data, width, height]);
  return <svg ref={svgRef} style={{ width: "100%", height: "auto", display: "block" }} />;
};

const ServiceLongevityBar = ({ data, width = 340, height = 260 }) => {
  const svgRef = useRef();
  useEffect(() => {
    if (!data || !data.length) return;
    const svg = d3.select(svgRef.current)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    svg.selectAll("*").remove();
    const m = { top: 20, right: 20, bottom: 50, left: 45 };
    const w = width - m.left - m.right, h = height - m.top - m.bottom;
    const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);
    const palette = [PURPLE, BLUE, TEAL, INDIGO, PINK, ORANGE];
    const x = d3.scaleBand().domain(data.map(d => d.service)).range([0, w]).padding(0.3);
    const y = d3.scaleLinear().domain([0, d3.max(data, d => d.avg_tenure) * 1.15]).range([h, 0]).nice();
    const tip = d3.select("body").append("div").attr("class", "d3-tooltip").style("opacity", 0);
    data.forEach((d, i) => {
      const col = palette[i % palette.length];
      g.append("rect").attr("x", x(d.service)).attr("y", y(d.avg_tenure)).attr("width", x.bandwidth()).attr("height", h - y(d.avg_tenure)).attr("fill", col).attr("rx", 6).attr("cursor", "pointer")
        .on("mouseover", function (ev) { tip.transition().duration(200).style("opacity", 0.9); tip.html(`${d.service}<br/>${d.avg_tenure.toFixed(1)} months`).style("left", ev.pageX + 10 + "px").style("top", ev.pageY - 28 + "px"); d3.select(this).transition().attr("opacity", 0.8); })
        .on("mouseout", function () { tip.transition().duration(300).style("opacity", 0); d3.select(this).transition().attr("opacity", 1); });
      g.append("text").attr("x", x(d.service) + x.bandwidth() / 2).attr("y", y(d.avg_tenure) - 5).attr("text-anchor", "middle").style("font-size", "10px").style("font-weight", "700").style("fill", col).text(d.avg_tenure.toFixed(1));
    });
    g.append("g").call(d3.axisLeft(y).ticks(5)).style("font-size", "10px");
    g.append("g").attr("transform", `translate(0,${h})`).call(d3.axisBottom(x)).style("font-size", "10px");
    return () => tip.remove();
  }, [data, width, height]);
  return <svg ref={svgRef} style={{ width: "100%", height: "auto", display: "block" }} />;
};

const TenureLineChart = ({ data, width = 750, height = 390 }) => {
  const svgRef = useRef();
  useEffect(() => {
    if (!data || !data.length) return;
    const svg = d3.select(svgRef.current)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    svg.selectAll("*").remove();
    const m = { top: 15, right: 20, bottom: 40, left: 55 };
    const w = width - m.left - m.right, h = height - m.top - m.bottom;
    const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);
    const x = d3.scaleLinear().domain(d3.extent(data, d => d.years)).range([0, w]);
    const y = d3.scaleLinear().domain([0, d3.max(data, d => d.customers) * 1.1]).range([h, 0]).nice();
    const line = d3.line().x(d => x(d.years)).y(d => y(d.customers)).curve(d3.curveMonotoneX);
    const tip = d3.select("body").append("div").attr("class", "d3-tooltip").style("opacity", 0);
    g.append("path").datum(data).attr("fill", PURPLE).attr("fill-opacity", 0.12)
      .attr("d", d3.area().x(d => x(d.years)).y0(y(0)).y1(d => y(d.customers)).curve(d3.curveMonotoneX));
    g.append("path").datum(data).attr("fill", "none").attr("stroke", PURPLE).attr("stroke-width", 2.5).attr("d", line);
    g.selectAll("circle").data(data).enter().append("circle")
      .attr("cx", d => x(d.years)).attr("cy", d => y(d.customers)).attr("r", 4).attr("fill", PURPLE).attr("stroke", "white").attr("stroke-width", 1.5).attr("cursor", "pointer")
      .on("mouseover", function (ev, d) { tip.transition().duration(200).style("opacity", 0.9); tip.html(`Year ${d.years}<br/>${d.customers} customers`).style("left", ev.pageX + 10 + "px").style("top", ev.pageY - 28 + "px"); d3.select(this).transition().attr("r", 6); })
      .on("mouseout", function () { tip.transition().duration(300).style("opacity", 0); d3.select(this).transition().attr("r", 4); });
    g.append("g").call(d3.axisLeft(y).ticks(5)).style("font-size", "10px");
    g.append("g").attr("transform", `translate(0,${h})`).call(d3.axisBottom(x).ticks(data.length)).style("font-size", "10px");
    return () => tip.remove();
  }, [data, width, height]);
  return <svg ref={svgRef} style={{ width: "100%", height: "auto", display: "block" }} />;
};

// ========== MAIN ==========
const Dashboard = ({ serverData }) => {
  const [sentimentView, setSentimentView] = useState("sentiment");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedChart, setSelectedChart] = useState(null);
  const [aiResponse, setAiResponse] = useState("");
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [showAI, setShowAI] = useState(false);
  if (!serverData) {
    return (
      <div className="db-root" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div className="db-ai-loading">
          <span>Loading dashboard data...</span>
          <div className="db-dot-pulse" />
        </div>
      </div>
    );
  }
  const data = serverData;
  const totalCustomers = serverData.totalCustomers || 0;


  const handleCardClick = async (chartType, chartData, chartTitle) => {
    setSelectedChart({ type: chartType, data: chartData, title: chartTitle });
    setModalOpen(true); setIsLoadingAI(true); setAiResponse(""); setShowAI(true);
    const insight = await callClaudeAPI(chartType, chartData, chartTitle);
    setAiResponse(insight); setIsLoadingAI(false);
  };
  const closeModal = () => { setModalOpen(false); setSelectedChart(null); setAiResponse(""); };

  const riskBg = ["#FFE4E6", "#FFF3E0", "#EDE9FE", "#DCFCE7"];
  const riskDot = [RED, ORANGE, YELLOW, GREEN];
  const riskLabels = ["Immediate Action", "Moderate", "Average", "Good"];

  const topCategories = [...(data.serviceLife || [])].sort((a, b) => b.avg_tenure - a.avg_tenure);
  const maxTenure = topCategories[0]?.avg_tenure || 1;

  const renderModalChart = (type, chartData) => {
    const p = { width: 680, height: 420 };
    if (type === "Churn vs Not Churn") return <DonutChart data={chartData} {...p} />;
    if (type === "Retention vs Churn") return <RetentionBar data={chartData} {...p} />;
    if (type === "Sentiment") return <SentimentChart data={chartData} {...p} />;
    if (type === "Loyalty") return <PieChartD3 data={chartData} {...p} />;
    if (type === "Tenure") return <TenureLineChart data={chartData} {...p} />;
    if (type === "Service Life") return <ServiceLongevityBar data={chartData} {...p} />;
    return null;
  };

  return (
    <div className="db-root">

      {/* ══ ROW 1: KPI block (left) + Tenure chart (right) ══ */}
      <div className="db-row1">
        <div className="db-kpi-block">
          <div className="db-kpi-header">
            <h2 className="db-section-title">Customer Segments</h2>
            <button className="db-export-btn">🔵 Export CSV</button>
          </div>
          <div className="db-kpi-grid">
            {data.risk.map((item, i) => (
              <div key={i} className="db-kpi-card" style={{ background: riskBg[i] }}>
                <div className="db-kpi-dot" style={{ background: riskDot[i] }} />
                <div className="db-kpi-value">{item.count?.toLocaleString()}</div>
                <div className="db-kpi-label">{riskLabels[i] || item.segment}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="db-card db-clickable" onClick={() => handleCardClick("Tenure", data.tenure, "Tenure Decay Curve")}>
          <h3 className="db-card-title">Tenure Decay Curve</h3>
          <TenureLineChart data={data.tenure} width={400} height={220} />
        </div>
      </div>

      {/* ══ ROW 2: Retention | Satisfaction | Longevity ══ */}
      <div className="db-row2">
        <div className="db-card db-clickable" onClick={() => handleCardClick("Retention vs Churn", data.services, "Retention by Service")}>
          <h3 className="db-card-title">Retention by Service</h3>
          {/* Bọc thêm div này */}
          <div className="db-chart-container">
            <RetentionBar data={data.services} width={400} height={280} />
          </div>
        </div>

        <div className="db-card db-clickable" onClick={() => handleCardClick("Sentiment", data.sentiment, "Customer Satisfaction")}>
          <div className="db-card-title-row">
            <h3 className="db-card-title">Customer Satisfaction</h3>
            {/* <div className="db-toggle-group">
              <button className={`db-toggle ${sentimentView === "sentiment" ? "active" : ""}`} onClick={e => { e.stopPropagation(); setSentimentView("sentiment"); }}>Dist.</button>
              <button className={`db-toggle ${sentimentView === "coverage" ? "active" : ""}`} onClick={e => { e.stopPropagation(); setSentimentView("coverage"); }}>Coverage</button>
            </div> */}
          </div>
          <div className="db-chart-container">
            <SentimentChart data={data.sentiment} width={400} height={280} />
          </div>
        </div>

        <div className="db-card db-clickable" onClick={() => handleCardClick("Service Life", data.serviceLife, "Service Longevity")}>
          <h3 className="db-card-title">Service Longevity</h3>
          <div className="db-chart-container">
            <ServiceLongevityBar data={data.serviceLife} width={400} height={280} />
          </div>
        </div>
      </div>

      {/* ══ ROW 3: Table | Loyalty Pie | Churn Donut ══ */}
      <div className="db-row3">
        <div className="db-card">
          <h3 className="db-card-title">Top Retained Categories</h3>
          <table className="db-table">
            <thead>
              <tr><th>#</th><th>Service</th><th>Popularity</th></tr>
            </thead>
            <tbody>
              {topCategories.map((item, i) => (
                <tr key={i}>
                  <td className="db-num">0{i + 1}</td>
                  <td>{item.service}</td>
                  <td>
                    <div className="db-progress-bg">
                      <div className="db-progress-fill" style={{ width: `${(item.avg_tenure / maxTenure) * 100}%` }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="db-card db-clickable" onClick={() => handleCardClick("Loyalty", data.loyalty, "Loyalty Status")}>
          <h3 className="db-card-title">Loyalty Status</h3>
          <div className="db-chart-center">
            <PieChartD3 data={data.loyalty} width={400} height={280} />
          </div>
        </div>

        <div className="db-card db-clickable" onClick={() => handleCardClick("Churn vs Not Churn", data.churn, "Churn vs Retention")}>
          <h3 className="db-card-title">Churn vs Retention</h3>
          <div className="db-chart-center">
            <DonutChart data={data.churn} width={400} height={280} />
          </div>
        </div>
      </div>

      {/* ══ MODAL ══ */}
      {modalOpen && selectedChart && (
        <div className="db-overlay" onClick={closeModal}>
          <div className="db-modal" onClick={e => e.stopPropagation()}>
            <div className="db-modal-head">
              <h2>📊 {selectedChart.title}</h2>
              <button className="db-modal-close" onClick={closeModal}>✕</button>
            </div>
            <div className="db-modal-body">
              <div className="db-modal-chart">{renderModalChart(selectedChart.type, selectedChart.data)}</div>
              <div className="db-ai-box">
                <div className="db-ai-head" onClick={() => setShowAI(!showAI)}>
                  <h4>✨ AI-Powered Insights</h4>
                  <span className={`db-arrow ${showAI ? "open" : ""}`}>⌄</span>
                </div>
                <div className={`db-ai-body ${showAI ? "open" : ""}`}>
                  {isLoadingAI
                    ? <div className="db-ai-loading"><span>Analyzing data…</span><div className="db-dot-pulse" /></div>
                    : <p className="db-ai-text">{aiResponse || "Generating analysis…"}</p>
                  }
                </div>
              </div>
              <div className="db-modal-foot">
                <button className="db-cta" onClick={closeModal}>Close Analysis</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;