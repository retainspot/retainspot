import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

const PURPLE = "#7c3aed";
const PURPLE_DARK = "#6d28d9";
const ORANGE = "#f97316";
const GREEN = "#10b981";
const RED = "#ef4444";
const BLUE = "#3b82f6";
const YELLOW = "#fbbf24";
const TEAL = "#14b8a6";
const INDIGO = "#6366f1";
const GRAY = "#64748b";

export const DonutChart = ({ data, width = 450, height = 350 }) => {
  const svgRef = useRef();
  useEffect(() => {
    if (!data || data.length === 0) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    const radius = Math.min(width, height) / 2.2;
    const innerRadius = radius * 0.6;
    const pie = d3.pie().value((d) => d.value).sort(null);
    const arc = d3.arc().innerRadius(innerRadius).outerRadius(radius);
    const color = d3.scaleOrdinal().domain(data.map((d) => d.status)).range([RED, GREEN]);
    const g = svg.append("g").attr("transform", `translate(${width / 2}, ${height / 2})`);

    const arcs = g.selectAll("arc").data(pie(data)).enter().append("g");
    arcs.append("path").attr("d", arc).attr("fill", (d) => color(d.data.status)).attr("stroke", "white").attr("stroke-width", 2);
    arcs.append("text")
      .attr("transform", (d) => `translate(${d3.arc().innerRadius(radius * 0.85).outerRadius(radius * 0.85).centroid(d)})`)
      .style("text-anchor", "middle").style("fill", "white").style("font-weight", "700")
      .text((d) => `${((d.data.value / d3.sum(data, (d) => d.value)) * 100).toFixed(0)}%`);
  }, [data, width, height]);
  return <svg ref={svgRef} width={width} height={height} />;
};

export const RetentionVsChurnSideBySide = ({ data, width = 450, height = 350 }) => {
  const svgRef = useRef();
  useEffect(() => {
    if (!data || data.length === 0) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    const margin = { top: 40, right: 20, bottom: 40, left: 40 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const chartData = data.map(d => ({ service: d.service, retained: 100 - d.avg_churn, churned: d.avg_churn }));
    const xScale = d3.scaleBand().domain(chartData.map(d => d.service)).range([0, w]).padding(0.3);
    const subGroupScale = d3.scaleBand().domain(["Retained", "Churned"]).range([0, xScale.bandwidth()]).padding(0.1);
    const yScale = d3.scaleLinear().domain([0, 100]).range([h, 0]);

    chartData.forEach(d => {
      g.append("rect").attr("x", xScale(d.service) + subGroupScale("Retained")).attr("y", yScale(d.retained)).attr("width", subGroupScale.bandwidth()).attr("height", h - yScale(d.retained)).attr("fill", PURPLE).attr("rx", 4);
      g.append("rect").attr("x", xScale(d.service) + subGroupScale("Churned")).attr("y", yScale(d.churned)).attr("width", subGroupScale.bandwidth()).attr("height", h - yScale(d.churned)).attr("fill", ORANGE).attr("rx", 4);
    });
    g.append("g").attr("transform", `translate(0, ${h})`).call(d3.axisBottom(xScale)).selectAll("text").style("font-size", "10px");
    g.append("g").call(d3.axisLeft(yScale).ticks(5));
  }, [data, width, height]);
  return <svg ref={svgRef} width={width} height={height} />;
};

export const SentimentStackedChart = ({ data, width = 450, height = 350 }) => {
  const svgRef = useRef();
  useEffect(() => {
    if (!data || data.length === 0) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    const margin = { top: 20, right: 20, bottom: 40, left: 50 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const pos = data.find(d => d.sentiment === "Positive")?.value || 0;
    const neu = data.find(d => d.sentiment === "Neutral")?.value || 0;
    const neg = data.find(d => d.sentiment === "Negative")?.value || 0;
    const total = pos + neu + neg;

    const yScale = d3.scaleLinear().domain([0, total]).range([h, 0]);
    const bw = w * 0.6;
    const bx = (w - bw) / 2;

    g.append("rect").attr("x", bx).attr("y", yScale(pos)).attr("width", bw).attr("height", h - yScale(pos)).attr("fill", GREEN);
    g.append("rect").attr("x", bx).attr("y", yScale(pos + neu)).attr("width", bw).attr("height", yScale(pos) - yScale(pos + neu)).attr("fill", YELLOW);
    g.append("rect").attr("x", bx).attr("y", yScale(total)).attr("width", bw).attr("height", yScale(pos + neu) - yScale(total)).attr("fill", RED);
    g.append("g").call(d3.axisLeft(yScale).ticks(5));
  }, [data, width, height]);
  return <svg ref={svgRef} width={width} height={height} />;
};

export const PieChartComponent = ({ data, width = 450, height = 350 }) => {
  const svgRef = useRef();
  useEffect(() => {
    if (!data || data.length === 0) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    const radius = Math.min(width, height) / 2.2;
    const pie = d3.pie().value(d => d.value).sort(null);
    const arc = d3.arc().innerRadius(0).outerRadius(radius);
    const color = d3.scaleOrdinal().domain(data.map(d => d.type)).range([GREEN, RED]);
    const g = svg.append("g").attr("transform", `translate(${width / 2}, ${height / 2})`);

    const arcs = g.selectAll("arc").data(pie(data)).enter().append("g");
    arcs.append("path").attr("d", arc).attr("fill", d => color(d.data.type)).attr("stroke", "white");
  }, [data, width, height]);
  return <svg ref={svgRef} width={width} height={height} />;
};

export const LineChartComponent = ({ data, width = 450, height = 350 }) => {
  const svgRef = useRef();
  useEffect(() => {
    if (!data || data.length === 0) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    const margin = { top: 20, right: 20, bottom: 40, left: 50 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLinear().domain(d3.extent(data, d => d.years)).range([0, w]);
    const yScale = d3.scaleLinear().domain([0, d3.max(data, d => d.customers)]).range([h, 0]);
    const line = d3.line().x(d => xScale(d.years)).y(d => yScale(d.customers)).curve(d3.curveMonotoneX);

    g.append("path").datum(data).attr("fill", PURPLE).attr("fill-opacity", 0.1).attr("d", d3.area().x(d => xScale(d.years)).y0(h).y1(d => yScale(d.customers)));
    g.append("path").datum(data).attr("fill", "none").attr("stroke", PURPLE).attr("stroke-width", 3).attr("d", line);
    g.append("g").attr("transform", `translate(0, ${h})`).call(d3.axisBottom(xScale));
    g.append("g").call(d3.axisLeft(yScale).ticks(5));
  }, [data, width, height]);
  return <svg ref={svgRef} width={width} height={height} />;
};

export const ServiceLongevityChart = ({ data, width = 450, height = 350 }) => {
  const svgRef = useRef();
  useEffect(() => {
    if (!data || data.length === 0) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    const margin = { top: 30, right: 20, bottom: 40, left: 50 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleBand().domain(data.map(d => d.service)).range([0, w]).padding(0.3);
    const yScale = d3.scaleLinear().domain([0, d3.max(data, d => d.avg_tenure)]).range([h, 0]);
    const colors = [PURPLE, BLUE, TEAL, INDIGO];

    g.selectAll("bar").data(data).enter().append("rect")
      .attr("x", d => xScale(d.service)).attr("y", d => yScale(d.avg_tenure))
      .attr("width", xScale.bandwidth()).attr("height", d => h - yScale(d.avg_tenure))
      .attr("fill", (d, i) => colors[i % colors.length]).attr("rx", 4);
    
    g.append("g").attr("transform", `translate(0, ${h})`).call(d3.axisBottom(xScale));
    g.append("g").call(d3.axisLeft(yScale).ticks(5));
  }, [data, width, height]);
  return <svg ref={svgRef} width={width} height={height} />;
};

// 7. Biểu đồ Coverage (Null vs Not Null)
export const NullVsNotNullChart = ({ data, width = 450, height = 350, totalCustomers = 0 }) => {
  const svgRef = useRef();
  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    const margin = { top: 30, right: 20, bottom: 40, left: 50 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const totalFeedback = data.reduce((sum, d) => sum + d.value, 0);
    const chartData = [
      { type: "Feedback", value: totalFeedback, color: GREEN },
      { type: "No Feedback", value: Math.max(0, totalCustomers - totalFeedback), color: RED }
    ];

    const xScale = d3.scaleBand().domain(chartData.map(d => d.type)).range([0, w]).padding(0.4);
    const yScale = d3.scaleLinear().domain([0, totalCustomers]).range([h, 0]);

    g.selectAll("rect").data(chartData).enter().append("rect")
      .attr("x", d => xScale(d.type)).attr("y", d => yScale(d.value))
      .attr("width", xScale.bandwidth()).attr("height", d => h - yScale(d.value))
      .attr("fill", d => d.color).attr("rx", 6);
    
    g.append("g").attr("transform", `translate(0, ${h})`).call(d3.axisBottom(xScale));
    g.append("g").call(d3.axisLeft(yScale).ticks(5));
  }, [data, width, height, totalCustomers]);
  return <svg ref={svgRef} width={width} height={height} />;
};