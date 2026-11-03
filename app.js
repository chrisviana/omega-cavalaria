const COMMAND = [
  { rank: "Líder", name: "", img: "assets/lider.png" },
  { rank: "Vice-Líder", name: "", img: "assets/vice-lider.png" },
];

const KNIGHTS = [
  { name: ".GagoExe.", img: "assets/cavaleiros/gagoexe.png" },
  { name: "-Vini", img: "assets/cavaleiros/vini.png" },
  { name: "cello=23", img: "assets/cavaleiros/cello23.png" },
  { name: "Dreide800", img: "assets/cavaleiros/dreide800.png" },
  { name: "marileevis", img: "assets/cavaleiros/marileevis.png" },
  { name: "Myau", img: "assets/cavaleiros/myau.png" },
  { name: "SrKownts", img: "assets/cavaleiros/srkownts.png" },
  { name: "xpudimdocex", img: "assets/cavaleiros/xpudimdocex.png" },
  { name: "Truwp", img: "assets/cavaleiros/Truwp.png" },
];

const $ = (sel) => document.querySelector(sel);

function memberCard({ rank, name, img }, isCommand) {
  const el = document.createElement("article");
  el.className = "member" + (isCommand ? " command" : "");
  el.innerHTML = `
    <div class="avatar"><img alt=""></div>
    <span class="rank"></span>
    ${name ? '<p class="member-name"></p>' : ""}
  `;
  el.querySelector("img").src = img;
  el.querySelector("img").alt = name || rank;
  el.querySelector(".rank").textContent = rank;
  if (name) el.querySelector(".member-name").textContent = name;
  return el;
}

$("#command-grid").append(...COMMAND.map((m) => memberCard(m, true)));
$("#knights-grid").append(...KNIGHTS.map((m) => memberCard({ rank: "Cavaleiro", ...m }, false)));

