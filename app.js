// Configurazione dei tuoi ISIN / Ticker e quote
const portafoglio = [
    {
        isin: "LU1650489385",
        ticker: "MTE.PA",
        nome: "Amundi Euro Gov Bond 10-15Y",
        quote: 50,
        pmc: 195.50
    }
];

async function recuperaDatiETF(ticker) {
    // Utilizziamo un proxy CORS pubblico per accedere ai dati Yahoo Finance dal browser
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=5d&interval=1d`;
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    
    try {
        const response = await fetch(proxyUrl);
        const data = await response.json();
        const parsed = JSON.parse(data.contents);
        
        const result = parsed.chart.result[0];
        const quoteArray = result.indicators.quote[0].close;
        
        const prezzoAttuale = quoteArray[quoteArray.length - 1];
        const prezzoIeri = quoteArray[quoteArray.length - 2] || prezzoAttuale;
        const varGiornaliera = ((prezzoAttuale - prezzoIeri) / prezzoIeri) * 100;
        
        return {
            prezzo: prezzoAttuale,
            varGiornaliera: varGiornaliera
        };
    } catch (e) {
        console.error("Errore nel recupero dati per " + ticker, e);
        return null;
    }
}

async function renderPortafoglio() {
    const tbody = document.getElementById("portfolio-body");
    tbody.innerHTML = "";
    
    for (const item of portafoglio) {
        const dati = await recuperaDatiETF(item.ticker);
        
        if (!dati) continue;
        
        const valoreTotale = item.quote * dati.prezzo;
        const investito = item.quote * item.pmc;
        const pnlEuro = valoreTotale - investito;
        const pnlPerc = ((dati.prezzo - item.pmc) / item.pmc) * 100;
        
        const classPnl = pnlEuro >= 0 ? "pos" : "neg";
        const classVar = dati.varGiornaliera >= 0 ? "pos" : "neg";
        
        const row = `
            <tr>
                <td><strong>${item.nome}</strong><br><small style="color:#64748b">${item.isin}</small></td>
                <td>${dati.prezzo.toFixed(2)} €</td>
                <td>${item.quote}</td>
                <td>${valoreTotale.toFixed(2)} €</td>
                <td class="${classPnl}">${pnlEuro >= 0 ? '+' : ''}${pnlEuro.toFixed(2)} € (${pnlPerc.toFixed(2)}%)</td>
                <td class="${classVar}">${dati.varGiornaliera >= 0 ? '+' : ''}${dati.varGiornaliera.toFixed(2)}%</td>
            </tr>
        `;
        tbody.innerHTML += row;
    }
    
    document.getElementById("last-update").innerText = `Ultimo aggiornamento: ${new Date().toLocaleString('it-IT')}`;
}

// Esegui al caricamento della pagina
renderPortafoglio();