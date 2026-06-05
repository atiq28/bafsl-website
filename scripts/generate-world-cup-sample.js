const fs = require("node:fs");
const path = require("node:path");
const { PDFDocument, StandardFonts, rgb } = require("../vendor/pdf-lib.min.js");

const root = path.resolve(__dirname, "..");
const output = path.join(root, "samples", "bafsl-world-cup-prediction-sample.pdf");
const rounds = [
  {
    title: "Round of 32",
    matches: [
      [73, "South Africa", "Bosnia and Herzegovina", "South Africa"],
      [74, "Germany", "Qatar", "Germany"],
      [75, "Netherlands", "Morocco", "Netherlands"],
      [76, "Brazil", "Japan", "Brazil"],
      [77, "France", "Australia", "France"],
      [78, "Paraguay", "Senegal", "Senegal"],
      [79, "Mexico", "Haiti", "Mexico"],
      [80, "England", "Sweden", "England"],
      [81, "USA", "Korea Republic", "USA"],
      [82, "Belgium", "IR Iran", "Belgium"],
      [83, "Congo DR", "Croatia", "Croatia"],
      [84, "Spain", "Algeria", "Spain"],
      [85, "Canada", "Saudi Arabia", "Canada"],
      [86, "Argentina", "Cabo Verde", "Argentina"],
      [87, "Portugal", "Egypt", "Portugal"],
      [88, "Paraguay", "Egypt", "Paraguay"]
    ]
  },
  {
    title: "Round of 16",
    matches: [
      [89, "Germany", "France", "France"],
      [90, "South Africa", "Netherlands", "Netherlands"],
      [91, "Brazil", "Senegal", "Brazil"],
      [92, "Mexico", "England", "England"],
      [93, "Croatia", "Spain", "Spain"],
      [94, "USA", "Belgium", "USA"],
      [95, "Argentina", "Paraguay", "Argentina"],
      [96, "Canada", "Portugal", "Portugal"]
    ]
  },
  {
    title: "Quarter-finals",
    matches: [
      [97, "France", "Netherlands", "France"],
      [98, "Spain", "USA", "Spain"],
      [99, "Brazil", "England", "Brazil"],
      [100, "Argentina", "Portugal", "Argentina"]
    ]
  },
  {
    title: "Semi-finals",
    matches: [
      [101, "France", "Spain", "France"],
      [102, "Brazil", "Argentina", "Argentina"]
    ]
  },
  { title: "World Cup Final", matches: [[104, "France", "Argentina", "Argentina"]] }
];

async function generate() {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const logo = await pdf.embedPng(fs.readFileSync(path.join(root, "assets", "bafsl-logo.png")));
  const green = rgb(0.047, 0.31, 0.267);
  const yellow = rgb(0.941, 0.706, 0.161);
  const ink = rgb(0.071, 0.125, 0.114);
  const muted = rgb(0.38, 0.44, 0.42);
  const pale = rgb(0.957, 0.969, 0.961);
  let page;
  let y;

  const addPage = (heading) => {
    page = pdf.addPage([612, 792]);
    page.drawRectangle({ x: 0, y: 718, width: 612, height: 74, color: green });
    page.drawImage(logo, { x: 38, y: 730, width: 50, height: 50 });
    page.drawText("BAFSL", { x: 102, y: 758, size: 19, font: bold, color: rgb(1, 1, 1) });
    page.drawText("Bay Area Friendly Soccer League", { x: 102, y: 740, size: 9, font: regular, color: rgb(0.85, 0.92, 0.9) });
    page.drawText(heading, { x: 38, y: 690, size: 22, font: bold, color: ink });
    page.drawRectangle({ x: 38, y: 678, width: 72, height: 4, color: yellow });
    page.drawText("BAFSL.COM  |  WORLD CUP 2026 BRACKET CHALLENGE", { x: 38, y: 22, size: 8, font: bold, color: muted });
    y = 654;
  };

  const matchCard = (match, title) => {
    if (y < 132) addPage(title);
    page.drawRectangle({ x: 38, y: y - 70, width: 536, height: 82, color: rgb(1, 1, 1), borderColor: rgb(0.82, 0.87, 0.84), borderWidth: 1 });
    page.drawText(`MATCH ${match[0]}`, { x: 50, y: y - 3, size: 8, font: bold, color: muted });
    page.drawText(match[1], { x: 50, y: y - 25, size: 12, font: bold, color: ink });
    page.drawText("VS", { x: 294, y: y - 25, size: 9, font: bold, color: muted });
    page.drawText(match[2], { x: 332, y: y - 25, size: 12, font: bold, color: ink });
    page.drawRectangle({ x: 38, y: y - 70, width: 536, height: 27, color: green });
    page.drawText("PREDICTED WINNER", { x: 50, y: y - 60, size: 8, font: bold, color: rgb(0.78, 0.9, 0.85) });
    page.drawText(match[3], { x: 178, y: y - 61, size: 12, font: bold, color: yellow });
    y -= 94;
  };

  addPage("World Cup 2026 Prediction");
  page.drawText("OFFICIAL PREDICTION RECORD", { x: 38, y, size: 10, font: bold, color: green });
  page.drawRectangle({ x: 38, y: y - 84, width: 536, height: 72, color: pale });
  page.drawText("Sample Participant", { x: 54, y: y - 34, size: 20, font: bold, color: ink });
  page.drawText("sample@bafsl.com", { x: 54, y: y - 56, size: 10, font: regular, color: muted });
  page.drawText("Sample bracket showing the visitor PDF format", { x: 54, y: y - 73, size: 9, font: regular, color: muted });
  y -= 118;
  page.drawRectangle({ x: 38, y: y - 4, width: 536, height: 24, color: green });
  page.drawText("GROUP STAGE SUMMARY", { x: 48, y: y + 3, size: 11, font: bold, color: rgb(1, 1, 1) });
  y -= 34;
  const groups = ["Mexico / South Africa / Korea Republic", "Canada / Bosnia and Herzegovina / Qatar", "Brazil / Morocco / Haiti", "USA / Paraguay / Australia", "Germany / Curacao / Cote d'Ivoire", "Netherlands / Japan / Sweden", "Belgium / Egypt / IR Iran", "Spain / Cabo Verde / Saudi Arabia", "France / Senegal / Iraq", "Argentina / Algeria / Austria", "Portugal / Congo DR / Uzbekistan", "England / Croatia / Ghana"];
  groups.forEach((text, index) => {
    if (index % 2 === 0) page.drawRectangle({ x: 38, y: y - 6, width: 536, height: 22, color: pale });
    page.drawText(`GROUP ${String.fromCharCode(65 + index)}`, { x: 48, y, size: 9, font: bold, color: green });
    page.drawText(text, { x: 120, y, size: 9, font: regular, color: ink });
    y -= 22;
  });

  rounds.forEach((round) => {
    addPage(round.title);
    page.drawText("Fixture and predicted winner are shown together for every knockout game.", { x: 38, y: 654, size: 10, font: regular, color: muted });
    y = 626;
    round.matches.forEach((match) => matchCard(match, round.title));
  });
  page.drawRectangle({ x: 38, y: y - 70, width: 536, height: 58, color: yellow });
  page.drawText("PREDICTED WORLD CUP 2026 CHAMPION", { x: 54, y: y - 34, size: 10, font: bold, color: ink });
  page.drawText("Argentina", { x: 54, y: y - 55, size: 20, font: bold, color: green });

  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, await pdf.save());
  console.log(output);
}

generate();
