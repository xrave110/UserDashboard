
/* Moralis init code */
const blockchains = {
    ETH: {
        chain: "eth",
        ticker: "ETH",
        blockExplorer: "https://etherscan.io"
    },
    ROPSTEN: {
        chain: "ropsten",
        ticker: "ETH",
        blockExplorer: "https://ropsten.etherscan.io"
    },
    BNB: {
        chain: "bsc",
        ticker: "BNB",
        blockExplorer: "https://bscscan.com"
    },
    MATIC: {
        chain: "polygon",
        ticker: "MATIC",
        blockExplorer: "https://polygonscan.com"
    },

    AVX: {
        chain: "avalanche",
        ticker: "AVX",
        blockExplorer: "https://snowtrace.io"
    },
    FTM: {
        chain: "fantom",
        ticker: "FTM",
        blockExplorer: "https://ftmscan.com/"
    }
};

const envJson = JSON.parse(data);
const serverUrl = envJson[1]["SERVER_URL"];
const appId = envJson[0]["API_ID"];
Moralis.start({ serverUrl, appId });
const user = Moralis.User.current();

getDashboard(blockchains.ETH);

if(user == null && (!window.location.href.includes("/index.html"))){
    document.querySelector('body').style.display = 'none';
    window.location.href = "../index.html";
}
else if(user != null && window.location.href.includes("/index.html")){
    window.location.href = "./pages/dashboard.html";
}
else if(user != null && !window.location.href.includes("/index.html")){
    document.getElementById("wallet-address").innerHTML = `${user.get("ethAddress").substr(0, 6)}...${user.get("ethAddress").substr(-4, 4)}`;
    console.log(`${user.get("ethAddress").substr(0, 6)}...${user.get("ethAddress").substr(-4, 4)}`);
}


async function fetchCoinList (){
    let retCoins = await (await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false")).json();
    let retCoins1 = await (await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false")).json();
    let retCoins2 = await (await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=2&sparkline=false")).json();
    //getDashboard(blockchains.ETH);
    retCoins = retCoins1.concat(retCoins2);
    console.log(retCoins);

    return retCoins;
}

/* Authentication code */
async function login(email, password) {
let user = Moralis.User.current();
    if (!user) {
        user = await Moralis.authenticate({ signingMessage: "Log in to the dashboard area"}) // Message which appear in MetaMask
        .then(async function (user) {
            console.log("logged in user:", user);
            console.log(user.get("ethAddress"));
            document.getElementById("btn-login-meta").innerHTML = 
                `Logged as ${user.get("ethAddress").substr(0, 6)}...${user.get("ethAddress").substr(-4, 4)}`;
            user.set("password", password);
            user.set("email", email);
            await user.save();
            window.location.href = "./pages/dashboard.html";
        })
        .catch(function (error) {
            console.log(error);
        });
    }
}

async function signUp(email, password){
    const user = new Moralis.User();
    user.set("username", email);
    user.set("password", password);
    user.set("email", email);

    // other fields can be set just like with Moralis.Object
    //user.set("phone", "415-392-0202");
    try {
    await user.signUp();
    } catch (error) {
    // Show the error message somewhere and let the user try again.
    alert("Error: " + error.code + " " + error.message);
    }
}

async function logInEmail(email, password){
    try {
        const user = await Moralis.User.logIn(email, password);
    } catch (error) {
    // Show the error message somewhere and let the user try again.
    alert("Error: " + error.code + " " + error.message);
    }
}

async function logOut() {
    await Moralis.User.logOut();
    console.log("logged out");
    window.location.href = "../index.html";
}

async function getDashboard(blockchain) {
    document.getElementById("content-table").innerHTML = ``;
    document.getElementById("get-dashboard-link").setAttribute("class", "nav-link active");
    document.getElementById("get-transactions-link").setAttribute("class", "nav-link");
    document.getElementById("get-balances-link").setAttribute("class", "nav-link");
    document.getElementById("get-nfts-link").setAttribute("class", "nav-link");
    const options = { chain: blockchain.chain, address: user.get("ethAddress")};
    const nativeBalance = await Moralis.Web3API.account.getNativeBalance(options);
    const tokenBalances = await Moralis.Web3API.account.getTokenBalances(options);
    const coins = await fetchCoinList();
    //console.log(coins);
    let coinsSymbolsToValue;
    let coinsSymbolsToPrice = await coins.map(coin => `"${coin.symbol.toLowerCase()}": ${coin.current_price}` );
    coinsSymbolsToPrice = JSON.parse(`{${coinsSymbolsToPrice}}`);
    let coinsToActualValue;
    let tokenPrices;
    console.log(Object.keys(coinsSymbolsToPrice));
    console.log(tokenBalances.map(token => token.symbol));
    coinsToActualValue = tokenBalances
                    .filter((token) => Object.keys(coinsSymbolsToPrice)
                    .includes(token.symbol.toLowerCase()))
                    .map((itoken) => ({
                        ["name"] : itoken.symbol.toLowerCase(), 
                        ["value"] : (itoken.balance / 1e18).toFixed(5)*coinsSymbolsToPrice[itoken.symbol.toLowerCase()]
                    }));

    if(Object.keys(coinsSymbolsToPrice).includes(blockchain.ticker.toLowerCase())){
        coinsToActualValue.push({
            ["name"] : blockchain.ticker.toLowerCase(), 
            ["value"] : (nativeBalance.balance / 1e18).toFixed(5)*coinsSymbolsToPrice[blockchain.ticker.toLowerCase()]
        });
    }
    let totalAmount = 0;
    totalAmount = coinsToActualValue.reduce((stored, current) => stored + current.value, 0);
    coinsToActualValue.sort(function (a,b){
        return b.value - a.value;
    });
    document.getElementById("content-table").innerHTML = `<h3>Total amount: ${totalAmount.toFixed(2)} $<h3>`
    const listOfStyles = ["", "bg-success", "bg-info", "bg-warning", "bg-danger"];
    let idx = 0;
    coinsToActualValue.forEach(((coin) => {
        document.getElementById("content-table").innerHTML += `
        <div d-flex>
            <div class="progress">
                <div class="progress-bar progress-bar-striped ${listOfStyles[idx]}" role="progressbar" style="width: ${(coin.value/totalAmount)*100}%" aria-valuenow="10" aria-valuemin="0" aria-valuemax="100">${coin.name.toUpperCase()} ${((coin.value/totalAmount)*100).toFixed(2)}%</div>
            </div>
            <div>${coin.value.toFixed(5)} $</div>
        </div>`;
        idx++;
    }))

    
}

async function getTransactions(blockchain) {
    document.getElementById("title").innerHTML = `Transactions`;
    document.getElementById("get-dashboard-link").setAttribute("class", "nav-link");
    document.getElementById("get-transactions-link").setAttribute("class", "nav-link active");
    document.getElementById("get-balances-link").setAttribute("class", "nav-link");
    document.getElementById("get-nfts-link").setAttribute("class", "nav-link");
    document.getElementById("content-table").innerHTML = '';
    const options = { chain: blockchain.chain, address: user.get("ethAddress")};
    const transactions = await Moralis.Web3API.account.getTransactions(options);
    console.log(transactions.result);
    if(transactions.total > 0){
        let table = `
        <table class="table">
        <thead>
            <tr>
                <th scope="col">Transaction</th>
                <th scope="col">Block number</th>
                <th scope="col">Age</th>
                <th scope="col">Type</th>
                <th scope="col">Fee</th>
                <th scope="col">Value</th>
            </tr>
        </thead>
        <tbody id="theTransaction">
        </tbody>
        </table>
        `
        document.getElementById("content-table").innerHTML = table;
        transactions.result.forEach(t => {
            let content = `
            <tr>
                <td><a href='${blockchain.blockExplorer}/tx/${t.hash}' target='_blank' rel='noopener noreferrer'>${t.hash}</a></td>
                <td><a href='${blockchain.blockExplorer}/block/${t.block_number}' target='_blank' rel='noopener noreferrer'>${t.block_number}</a></td>
                <td>${millisecondsToTime(Date.parse(new Date()) - Date.parse(t.block_timestamp))}</td>
                <td>${t.from_address == Moralis.User.current().get('ethAddress') ? 'Outgoing' : 'Incomming'}</td>
                <td>${((t.gas * t.gas_price) / 1e18).toFixed(5)} ${blockchain.ticker}</td>
                <td>${(t.value / 1e18).toFixed(5)} ${blockchain.ticker}</td>
            </tr>`;
            theTransaction.innerHTML += content;
        })
    }
    else{
        document.getElementById("content-table").innerHTML = `There are no transactions on ${blockchain.chain}`;
    }
}

async function getBalances(blockchain){
    document.getElementById("title").innerHTML = `Balances`;
    document.getElementById("get-dashboard-link").setAttribute("class", "nav-link");
    document.getElementById("get-transactions-link").setAttribute("class", "nav-link");
    document.getElementById("get-balances-link").setAttribute("class", "nav-link active");
    document.getElementById("get-nfts-link").setAttribute("class", "nav-link");
    const options = { chain: blockchain.chain, address: user.get("ethAddress")};
    const nativeBalance = await Moralis.Web3API.account.getNativeBalance(options);
    const tokenBalances = await Moralis.Web3API.account.getTokenBalances(options);
    document.getElementById('content-table').innerHTML = `
    <table class="table">
    <thead>
        <tr>
            <th scope="col">Ticker</th>
            <th scope="col">Balance</th>
            <th scope="col">Contract</th>
        </tr>
    </thead>
    <tbody id="theBalance">
        <tr>
            <td>
                <strong>Chain: ${blockchain.chain.toUpperCase()}</strong>
            </td>
            <td>
                <strong>Native Balance: ${(nativeBalance.balance / 1e18).toFixed(5)} ${blockchain.ticker}</strong>
            </td>
            <td>
            <strong> NA </strong>
            </td>
        </tr>
    </tbody>
    </table>
    `
    tokenBalances.forEach( f => {
        let content = 
        `<tr>
            <th> ${f.symbol} </th>
            <th> ${(f.balance / 10**f.decimals).toFixed(5)} </th>
            <th> <a href='${blockchain.blockExplorer}/token/${f.token_address}' target='_blank' rel='noopener noreferrer'>${f.token_address}</a></th>
        </tr>`
        theBalance.innerHTML += content;
    })
}

async function getNfts(blockchain){
    document.getElementById("title").innerHTML = `NFTs`;
    document.getElementById('content-table').innerHTML = ``;
    document.getElementById("get-dashboard-link").setAttribute("class", "nav-link");
    document.getElementById("get-transactions-link").setAttribute("class", "nav-link");
    document.getElementById("get-balances-link").setAttribute("class", "nav-link");
    document.getElementById("get-nfts-link").setAttribute("class", "nav-link active");
    const options = { chain: blockchain.chain, address: user.get("ethAddress")};
    const nfts = await Moralis.Web3API.account.getNFTs(options);
    console.log(nfts);
    if(nfts.result.length > 0){
        document.getElementById('content-table').innerHTML = `<div id="nfts" class="d-flex flex-wrap"></div>`;
        nfts.result.forEach(n => {
            let metadata = JSON.parse(n.metadata);
            if(metadata == null || typeof(metadata) != "object")
            {
                metadata = {"name": "None", "description": "None", "image": "None"};
            }
            if(!metadata.image.includes("https"))
            {
                metadata.image = "../images/null.jpg";
            }
            metadata.image = fixUrl(metadata.image);
            
            document.getElementById("nfts").innerHTML += 
            `<div class="card col-md-2">
                <img src=${metadata.image} class="card-img-top height=200">
                <div class="card-body">
                    <p>[${n.contract_type}]</p>
                    <h6 class="card-title">${n.name} (${n.symbol})</h6>
                    <p class="card-text">${metadata.description}</p>
                </div>
            </div>`;
        })
    }
    else{
        document.getElementById('content-table').innerHTML = `No NFTs for this chain`;
    }
}

millisecondsToTime = (ms) => {
    let minutes = (ms / (1000 * 60));
    let hours = (ms / (1000 * 60 * 60));
    let days = (ms / (1000 * 60 * 60 * 24));
    if(days < 1){
        if(hours < 1){
            if(minutes < 1){
                return 'less than a minute ago';
            } else return `${minutes.toFixed(0)} minute(s) ago`;
        } else return `${hours.toFixed(0)} hour(s) ago`;
    } else return `${days.toFixed(0)} day(s) ago`;
}
fixUrl = (url) => {
    if(url.startsWith("ipfs")){
        return "https://ipfs.moralis.io:2053/ipfs/" + url.split("ipfs://").slice(-1);
    }
    else{
        return url + "?format=json";
    }
}

function accountDetailsStates(blockchainSymbol){
    if(document.getElementById("get-dashboard-link").getAttribute("class").includes("active")){
        console.log("Dashboard");
        getDashboard(blockchainSymbol);
    }
    else if(document.getElementById("get-transactions-link").getAttribute("class").includes("active")){
        getTransactions(blockchainSymbol);
    }
    else if(document.getElementById("get-balances-link").getAttribute("class").includes("active")){
        getBalances(blockchainSymbol);
    }
    else if(document.getElementById("get-nfts-link").getAttribute("class").includes("active")){
        getNfts(blockchainSymbol);
    }
    
}
// Entrance
if(document.getElementById("btn-login-meta") != null &&
    document.getElementById("btn-signup") != null &&
    document.getElementById("btn-login-email") != null)
{
    document.getElementById("btn-login-meta").onclick = 
        () => login(document.getElementById("floatingInput").value, document.getElementById("floatingPassword").value);
    document.getElementById("btn-signup").onclick = 
        () => signUp(document.getElementById("floatingInput").value, document.getElementById("floatingPassword").value);
    document.getElementById("btn-login-email").onclick = 
        () => logInEmail(document.getElementById("floatingInput").value, document.getElementById("floatingPassword").value); 
}
if(document.getElementById("btn-logout") != null){      
    document.getElementById("btn-logout").onclick = logOut;
}
// Get types
if(document.getElementById("get-dashboard-link") != null){      
    document.getElementById("get-dashboard-link").onclick = () => getDashboard(blockchains.ETH);
}
if(document.getElementById("get-transactions-link") != null){      
    document.getElementById("get-transactions-link").onclick = () => getTransactions(blockchains.ETH);
}
if(document.getElementById("get-balances-link") != null){      
    document.getElementById("get-balances-link").onclick = () => getBalances(blockchains.ETH);
}
if(document.getElementById("get-nfts-link") != null){      
    document.getElementById("get-nfts-link").onclick = () => getNfts(blockchains.ETH);
}


// Chains to select
if(document.getElementById("eth") != null){      
    document.getElementById("eth").onclick = () => accountDetailsStates(blockchains.ETH);
}
if(document.getElementById("ropsten") != null){      
    document.getElementById("ropsten").onclick = () => accountDetailsStates(blockchains.ROPSTEN);
}
if(document.getElementById("bnb") != null){      
    document.getElementById("bnb").onclick = () => accountDetailsStates(blockchains.BNB);
}
if(document.getElementById("matic") != null){      
    document.getElementById("matic").onclick = () => accountDetailsStates(blockchains.MATIC);
}
if(document.getElementById("avx") != null){      
    document.getElementById("avx").onclick = () => accountDetailsStates(blockchains.AVX);
}
if(document.getElementById("ftm") != null){      
    document.getElementById("ftm").onclick = () => accountDetailsStates(blockchains.FTM);
}
