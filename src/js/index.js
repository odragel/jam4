import '../../assets/css/main.css';
import users from "../../assets/json/users.json"
import sessions from "../../assets/json/sessions.json"
import * as _ from 'lodash';
import Chart from 'chart.js'

let chartCanvas = document.getElementById("chart");
let context = chartCanvas.getContext('2d');

const session1 = sessions.session1;
const session2 = sessions.session2;

let curPuzzles;
let curPlayers;


let selectedRows = new Map();

let playersForSessions = {};

let curSession = session1;

let radioSession = document.getElementById('school-session');
let demoSession = document.getElementById('demo-session');

const players = _.map(_.filter(users.users, function(user){ return user.provider == 'github';}),
    _.partialRight(_.pick, ['uid', 'displayName']));


radioSession.addEventListener('click', switchSession);
demoSession.addEventListener('click', switchSession);

switchSession();


function processUsers(session){
    if(typeof playersForSessions[session] == 'undefined'){
        let curPlayers = players.map(a => {
            let newObject = {};
            Object.keys(a).forEach(propertyKey => {
                newObject[propertyKey] = a[propertyKey];
            });
            return newObject ;
        });



        _.forEach(curSession.rounds, (round) => {
            _.map(curPlayers, function(player) {
                    let playerRound = round.solutions[player.uid];
                    let currentRound = {};
                    currentRound.puzzleIndex = round.puzzleIndex.$numberLong;
                    currentRound.time = (playerRound && playerRound.correct === 'Correct' )? parseInt(playerRound.time.$numberLong) : 150;
                    currentRound.selector = playerRound ? playerRound.code: '';

                    (player.results || (player.results = [])).push(currentRound);
                }
            )
        });

        _.map(curPlayers, function(player) {
            let total =_.sumBy(player.results, function(o) { return o.time; });
            player.total = total;
        });

        playersForSessions[session] = curPlayers;
        console.dir(curPlayers);
    }

}


function switchSession(){
    let selectedSession = document.querySelector("input[type='radio']:checked");
    if(selectedSession.value === "0"){
        selectedRows = new Map();
        curSession = session1;
        processUsers('session1');
        drawTableForResults(playersForSessions.session1);
        curPlayers = playersForSessions.session1;
        clearCanvas(context, chartCanvas);

    } else{
        selectedRows = new Map();
        curSession = session2;
        processUsers('session2');
        drawTableForResults(playersForSessions.session2);
        curPlayers = playersForSessions.session2;
        clearCanvas(context, chartCanvas);
    }
}


function drawTableForResults(curPlayers){
    let puzzles = _.map(curSession.puzzles, 'name');
    curPuzzles = puzzles;

    let sectionForTable = document.getElementById('table-results');
    sectionForTable.innerHTML='';

    let table = document.createElement('table');
    table.classList.add('main-table');

   //header
    let tableHeader = table.createTHead();
    let rowHeader = tableHeader.insertRow();
    let nameColumn = rowHeader.insertCell();
    nameColumn.innerText = 'Github';

    puzzles.forEach(puzzle => {
        let column = rowHeader.insertCell();
       column.innerText = puzzle;
    });

    let totalColumn = rowHeader.insertCell();
    totalColumn.innerText = 'Total';


    let selectedColumn = rowHeader.insertCell();
    selectedColumn.innerText = 'Select for chart';

    //rows
    curPlayers.forEach(player => {
            let rowPlayer = table.insertRow();
        let playerName = rowPlayer.insertCell();
            playerName.textContent = player.displayName;

            player.results.forEach(
                (result => {
                    let solution = rowPlayer.insertCell();
                    solution.title = result.selector;
                    solution.textContent = result.time;
                    if(result.selector.length > 0){
                        solution.classList.add('cursor-pointer');
                    }
                })
            );

            let total = rowPlayer.insertCell();
            total.textContent = player.total;

            let selected = rowPlayer.insertCell();
            let checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = player.uid;
            checkbox.addEventListener('click', selectRow);
            checkbox.classList.add('cursor-pointer');

            selected.appendChild(checkbox);
    }
    );

    sectionForTable.appendChild(table);


}


function selectRow(e){

    let selectedCheckboxes = document.querySelectorAll("input[type='checkbox']:checked");
    let checkbox = e.target;

    if(selectedCheckboxes.length <=10) {
        if (checkbox.checked) {
            let cell = checkbox.parentElement;
            let row = cell.parentElement;
            let rowChildren = row.childNodes;
            let amountOfResults = rowChildren.length - 2;
            let displayName = row.childNodes[0].textContent;
            let results = [];
            for(let i=1; i < amountOfResults; i++){
                results.push(parseInt(row.childNodes[i].textContent));
            }

            let selectedRow = {displayName: displayName, results: results};
            selectedRows.set(checkbox.id, selectedRow);
        } else {
            selectedRows.delete(checkbox.id);
        }
        drawCharts();

    } else{
        checkbox.checked = false;
        alert('You could not select more than 10 rows');
    }

}

function drawCharts(){

    clearCanvas(context, chartCanvas);

    let resultsData = {
        labels: curPuzzles,
        datasets: Array.from(selectedRows.values()).map((row) => {
            let dataset = {
                backgroundColor: 'transparent',
                lineTension: 0.3,
                fill: false,

                pointBackgroundColor: 'lightgreen',
                pointRadius: 5,
                pointHoverRadius: 15,
                pointHitRadius: 30,
                pointBorderWidth: 2
            }
            dataset.label = row.displayName;
            dataset.data = row.results;

            let color = intToRGB(hashCode(row.displayName));
            dataset.pointBorderColor = color;
            dataset.borderColor = color;

            return dataset;
        })};

    let chartOptions = {
        legend: {
            display: true,
            position: 'top',
            labels: {
                boxWidth: 80,
                fontColor: 'black'
            }
        },
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            xAxes: [{
                ticks: {
                    autoSkip: false,
                }
            }]
        }
    };

    let lineChart = new Chart(chartCanvas, {
        type: 'line',
        data: resultsData,
        options: chartOptions
    });

}

function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
}

function intToRGB(i){
    let c = (i & 0x00FFFFFF)
        .toString(16)
        .toUpperCase();

    return "#"+"00000".substring(0, 6 - c.length) + c;
}

function clearCanvas(context, canvas) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    var w = canvas.width;
    canvas.width = 1;
    canvas.width = w;
}








