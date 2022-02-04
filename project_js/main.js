/* Moralis init code */
const serverUrl = ${{ secrets.MORALIS_SERVER_URL }};
const appId = ${{ secrets.API_ID }};
Moralis.start({ serverUrl, appId });
const user = Moralis.User.current();

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

/* Authentication code */
async function login(email, password) {
let user = Moralis.User.current();
    if (!user) {
        user = await Moralis.authenticate({ signingMessage: "Log in to my page!!:)" }) // Message which appear in MetaMask
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

async function getTransactions(blockchain) {
    document.getElementById("tableOfTransactions").innerHTML = '';
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
        document.getElementById("tableOfTransactions").innerHTML = table;
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
}

async function getBalances(){
    
    const options = { chain: "ropsten", address: user.get("ethAddress")};
    const balance = await Moralis.Web3API.account.getNativeBalance(options);
    console.log((balance.balance / 1e18).toFixed(5));
    let content = document.getElementById('userBalances').innerHTML = `
    <table class="table">
    <thead>
        <tr>
            <th scope="col">Chain</th>
            <th scope="col">Balance</th>
        </tr>
    </thead>
    <tbody id="theTransaction">
        <tr>
            <td>
                Ether
            </td>
            <td>
                ${(balance.balance / 1e18).toFixed(5)} ETH
            </td>
        </tr>
    </tbody>
    </table>
    `
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

if(document.getElementById("get-transactions-link") != null){      
    document.getElementById("get-transactions-link").onclick = () => getTransactions(blockchains.ETH);
}
if(document.getElementById("eth-transactions") != null){      
    document.getElementById("eth-transactions").onclick = () => getTransactions(blockchains.ETH);
}
if(document.getElementById("ropsten-transactions") != null){      
    document.getElementById("ropsten-transactions").onclick = () => getTransactions(blockchains.ROPSTEN);
}
if(document.getElementById("bnb-transactions") != null){      
    document.getElementById("bnb-transactions").onclick = () => getTransactions(blockchains.BNB);
}
if(document.getElementById("matic-transactions") != null){      
    document.getElementById("matic-transactions").onclick = () => getTransactions(blockchains.MATIC);
}
if(document.getElementById("avx-transactions") != null){      
    document.getElementById("avx-transactions").onclick = () => getTransactions(blockchains.AVX);
}
if(document.getElementById("ftm-transactions") != null){      
    document.getElementById("ftm-transactions").onclick = () => getTransactions(blockchains.FTM);
}
/*
"eth-transactions" cl
"ropsten-transactions"
"bnb-transactions" cl
"matic-transactions" 
"avx-transactions" cl
"ftm-transactions" cl
*/

if(document.getElementById("get-balances-link") != null){      
    document.getElementById("get-balances-link").onclick = () => getBalances('ETH');
}
if(document.getElementById("get-nfts-link") != null){      
    document.getElementById("get-nfts-link").onclick = logOut;
}

//get-transactions-link
//get-balances-link
//get-nfts-link