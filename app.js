import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

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

// O id é o que fica salvo no Firestore; não altere depois que a votação começar.
const CRIES = [
  {
    id: "forca-que-impoe-respeito",
    title: "ÔMEGA – A força que impõe respeito",
    lyrics: `Somos ÔMEGA, somos tradição!
Na terra ou na batalha, jamais recuamos!
Com honra e coragem, seguimos em frente!
CAVALARIA ÔMEGA, AVANTE SEMPRE!`,
  },
  {
    id: "ultimo-a-cair",
    title: "O último a cair",
    lyrics: `Do primeiro ao último, ninguém ficará para trás!
Nossa força é a união, nossa honra é a missão!
Somos guerreiros, somos resistência!
ÔMEGA! ÔMEGA! SUPREMACIA!`,
  },
  {
    id: "espirito-de-cavalaria",
    title: "Espírito de Cavalaria",
    lyrics: `O chão vai tremer, o inimigo vai sentir!
Quando a ÔMEGA avança, ninguém vai nos impedir!
Com coragem no peito e honra na missão!
CAVALARIA ÔMEGA, DOMINANDO O FRONT!`,
  },
  {
    id: "honra-e-tradicao",
    title: "Honra e tradição",
    lyrics: `Forjados na disciplina!
Guiados pela lealdade!
Movidos pela coragem!
ÔMEGA É NOSSA IDENTIDADE!
CAVALARIA! HONRA E LIBERDADE!`,
  },
  {
    id: "imponente-e-marcante",
    title: "Imponente e marcante",
    lyrics: `Não somos muitos, somos os melhores!
Não buscamos glória, conquistamos vitórias!
Nossa bandeira é a honra!
Nossa missão é vencer!
ÔMEGA! NASCEMOS PARA COMBATER!`,
  },
  {
    id: "curto-e-forte",
    title: "Curto e forte (para gritar em conjunto)",
    lyrics: `QUEM SOMOS?
ÔMEGA!
QUAL NOSSA FORÇA?
UNIÃO!
QUAL NOSSA MARCA?
CORAGEM!
QUAL NOSSO DESTINO?
A VITÓRIA!
CAVALARIA ÔMEGA! AVANTE!`,
  },
  {
    id: "gloria-eterna",
    title: "Glória eterna",
    lyrics: `Em guerras e batalhas, a glória é eterna para Ômega!
Conspícuos guerreiros,
Avante, cavaleiros!
Quem pelo Exército lutar, pelo Exército há de cavalgar!`,
  },
  {
    id: "omega-escreve-sua-historia",
    title: "Ômega escreve sua história",
    lyrics: `Na luta ou na vitória, Ômega escreve sua história!
Quem chegou? Ômega!
Quem tem união? Ômega!
Quem tem garra e coração?
A cavalaria é nossa paixão!`,
  },
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

// --- Votação ---

const cards = new Map();

for (const [i, cry] of CRIES.entries()) {
  const el = document.createElement("article");
  el.className = "cry";
  el.innerHTML = `
    <span class="cry-num">#${String(i + 1).padStart(2, "0")}</span>
    <h3></h3>
    <p class="cry-lyrics"></p>
    <div class="cry-result">
      <div class="bar"><span></span></div>
      <div class="cry-count"><span class="votes">0 votos</span><span class="pct">0%</span></div>
    </div>
    <button class="btn btn-primary" disabled>Votar</button>
  `;
  el.querySelector("h3").textContent = cry.title;
  el.querySelector(".cry-lyrics").textContent = cry.lyrics;
  el.querySelector("button").addEventListener("click", () => vote(cry.id));
  $("#cries-grid").append(el);
  cards.set(cry.id, el);
}

const statusEl = $("#vote-status");
function setStatus(text, isError = false) {
  statusEl.textContent = text;
  statusEl.classList.toggle("error", isError);
}

let db = null;
let uid = null;
let myVote = null;
let busy = false;

function render(counts, total) {
  const max = Math.max(0, ...counts.values());
  for (const [id, el] of cards) {
    const n = counts.get(id) || 0;
    const pct = total ? Math.round((n / total) * 100) : 0;
    el.querySelector(".bar span").style.width = pct + "%";
    el.querySelector(".votes").textContent = `${n} ${n === 1 ? "voto" : "votos"}`;
    el.querySelector(".pct").textContent = pct + "%";
    el.classList.toggle("leader", max > 0 && n === max);
    el.classList.toggle("voted", id === myVote);
    const btn = el.querySelector("button");
    btn.disabled = !uid || busy;
    btn.textContent = id === myVote ? "✓ Seu voto" : myVote ? "Trocar para este" : "Votar";
  }
}

let lastCounts = new Map();
let lastTotal = 0;

async function vote(cryId) {
  if (!db || !uid || busy || cryId === myVote) return;
  busy = true;
  render(lastCounts, lastTotal);
  try {
    await setDoc(doc(db, "votos", uid), { opcao: cryId, atualizadoEm: serverTimestamp() });
  } catch (err) {
    console.error(err);
    setStatus("Não foi possível registrar seu voto. Tente novamente.", true);
  } finally {
    busy = false;
    render(lastCounts, lastTotal);
  }
}

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  setStatus("Votação ainda não configurada: preencha firebase-config.js.", true);
} else {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  db = getFirestore(app);

  onAuthStateChanged(auth, (user) => {
    if (!user) return;
    uid = user.uid;
    onSnapshot(
      collection(db, "votos"),
      (snap) => {
        const counts = new Map();
        myVote = null;
        snap.forEach((d) => {
          const { opcao } = d.data();
          counts.set(opcao, (counts.get(opcao) || 0) + 1);
          if (d.id === uid) myVote = opcao;
        });
        lastCounts = counts;
        lastTotal = snap.size;
        setStatus(
          `${snap.size} ${snap.size === 1 ? "voto registrado" : "votos registrados"}` +
            (myVote ? " · seu voto foi computado" : " · escolha um grito abaixo")
        );
        render(counts, snap.size);
      },
      (err) => {
        console.error(err);
        setStatus("Erro ao carregar os votos. Verifique as regras do Firestore.", true);
      }
    );
  });

  signInAnonymously(auth).catch((err) => {
    console.error(err);
    setStatus("Erro ao entrar na votação. Ative o login anônimo no Firebase.", true);
  });
}
