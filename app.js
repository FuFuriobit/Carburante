// Dati di default
const portafoglioDefault = [
    {
        isin: "LU1650489385",
        ticker: "MTE.PA",
        nome: "Amundi Euro Gov Bond 10-15Y",
        quote: 50,
        pmc: 195.50
    }
];

// Carica il portafoglio salvato o usa quello di default
let portafoglio = JSON.parse(localStorage.getItem("mio_portafoglio_etf")) || portafoglioDefault;

async function recuperaDatiETF(ticker) {
    const targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=5d&interval=1d`;
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
    
    try {
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error("Errore di rete");
        
        const data = await response.json();
        const result = data.chart.result[0];
        const quoteArray = result.indicators.quote[0].close.filter(val => val !== null);
        
        const prezzoAttuale = quoteArray[quoteArray.length - 1];
        const prezzoIeri = quoteArray[quoteArray.length - 2] || prezzoAttuale;
        const varGiornaliera = ((prezzoAttuale - prezzoIeri) / prezzoIeri) * 100;
        
        return {
            prezzo: prezzoAttuale,
            varGiornaliera: varGiornaliera
        };
    } catch (e) {
        console.error("Errore recupero dati:", e);
        return null;
    }
}

async function renderPortafoglio() {
    const tbody = document.getElementById("portfolio-body");
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Aggiornamento quotazioni...</td></tr>`;
    
    let rowsHtml = "";
    
    for (let i = 0; i < portafoglio.length; i++) {
        const item = portafoglio[i];
        const dati = await recuperaDatiETF(item.ticker);
        
        if (!dati) {
            rowsHtml += `
                <tr>
                    <td><strong>${item.nome}</strong><br><small style="color:#64748b">${item.isin}</small></td>
                    <td colspan="6" style="color:#ef4444;">⚠️ Impossibile caricare i dati</td>
                </tr>`;
            continue;
        }
        
        const quote = parseFloat(item.quote) || 0;
        const pmc = parseFloat(item.pmc) || 0;
        
        const valoreTotale = quote * dati.prezzo;
        const investito = quote * pmc;
        const pnlEuro = valoreTotale - investito;
        const pnlPerc = pmc > 0 ? ((dati.prezzo - pmc) / pmc) * 100 : 0;
        
        const classPnl = pnlEuro >= 0 ? "pos" : "neg";
        const classVar = dati.varGiornaliera >= 0 ? "pos" : "neg";
        
        rowsHtml += `
            <tr>
                <td><strong>${item.nome}</strong><br><small style="color:#64748b">${item.isin}</small></td>
                <td>${dati.prezzo.toFixed(2)} €</td>
                <td><input type="number" id="quote-${i}" value="${quote}" step="any"></td>
                <td><input type="number" id="pmc-${i}" value="${pmc}" step="any"></td>
                <td><strong>${valoreTotale.toFixed(2)} €</strong></td>
                <td class="${classPnl}">${pnlEuro >= 0 ? '+' : ''}${pnlEuro.toFixed(2)} € (${pnlPerc.toFixed(2)}%)</td>
                <td class="${classVar}">${dati.varGiornaliera >= 0 ? '+' : ''}${dati.varGiornaliera.toFixed(2)}%</td>
            </tr>
        `;
    }
    
    tbody.innerHTML = rowsHtml;
    document.getElementById("last-update").innerText = `Ultimo aggiornamento: ${new Date().toLocaleString('it-IT')}`;
}

function salvaEModifica() {
    for (let i = 0; i < portafoglio.length; i++) {
        const inputQuote = document.getElementById(`quote-${i}`);
        const inputPmc = document.getElementById(`pmc-${i}`);
        
        if (inputQuote && inputPmc) {
            portafoglio[i].quote = parseFloat(inputQuote.value) || 0;
            portafoglio[i].pmc = parseFloat(inputPmc.value) || 0;
        }
    }
    
    // Salva nella memoria del browser
    localStorage.setItem("mio_portafoglio_etf", JSON.stringify(portafoglio));
    
    // Ricalcola immediatamente la tabella
    renderPortafoglio();
}

// Avvio automatico
renderPortafoglio();