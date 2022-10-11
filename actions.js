import cases from './cases.js';
import standardTests from './standardTests.js';

// Action Management
// --------------------
var defaultActions=[
    {command: 'hjälp', description: 'Visa hjälptext.', key: 'Hjälp', value: () => printHelp() },
    {command: 'nästa', description: 'Be nästa patient att komma in.', key: 'Nästa patient!', value: () => nextPatient() },
    {command: 'backa', description: 'Be den förra patienten att komma in igen.', key: 'Kom tillbaka!', value: () => previousPatient() },
    {command: 'mer',   description: 'Få patienten att berätta mer.', key: 'Berätta mer...', value: () => nextHistory() },
    {command: 'test',  description: 'Tag prover på patienten.', key: 'Provtagning', value: (params) => issueTests(params) },
    {command: 'diagnos', description: 'Ställ en diagnos.', key: 'Diagnos', value: (params) => diagnosis(params) },
    {command: 'behandling', description: 'Föreslå en behandling.', key: 'Behandling', value: (params) => suggestTreatment(params) },
// Template:
//    {command: '', description: '', key: '', value: },
];

function getAllActions() {
    let actions = defaultActions;
    if (currentPatient) { actions=actions.concat(currentPatient.extraActions) };
    return actions;
}

function parseAndExecuteAction(txt) {
    let params = txt.toLowerCase().split(' ');
    let command = params.shift();    
    let actions = getAllActions();
    let selected = actions.find( a => a.command.startsWith(command) );
    if (!selected) {
        insertText('Jag bara säger det: ' + command, 'command');
    } else {
        insertText(`${selected.key} (${params})`, 'command');
        selected.value(params);
    }
}

// Action Handlers
// --------------------
function printHelp() {
    let actions = getAllActions();
    let helpText = actions.reduce( (t,a) => t+=`<tr><td>${a.command}</td><td>${a.description}</td></tr>`,
                                   '<b>Hjälp:</b><br><br><table><tr><td><b>Du skriver...</b></td><td><b>För att...</b></td></tr>')
    helpText += '</table>'
    insertText(helpText, 'tell');
}

var currentPatient = null;
var nextPatientId = 0;

function setupPatient() {
    currentPatient.isDiagnosed = false;
    currentPatient.nextHistory = 0;
    setHeader(currentPatient.name);
    let txt=`<b>${currentPatient.name}</b><br>
Ålder: ${currentPatient.bio.age}<br>
Kön: ${currentPatient.bio.gender}<br>
Vikt: ${currentPatient.bio.weight}<br>
Längd: ${currentPatient.bio.height}<br>`
    insertText(txt, 'tell');
    nextHistory();
}

function nextPatient() {
    if (currentPatient && !currentPatient.isDiagnosed) {
        insertText(`Du kan väl åtminstone ge en diagnos till ${currentPatient.name} innan du ropar in nästa patient.`, 'tell');
        return;
    }
    if (nextPatientId >= cases.length) {
        insertText('Du har inga fler patienter', 'tell');
        return;
    }
    currentPatient=cases[nextPatientId++];
    setupPatient();
}

function previousPatient() {
    if (0 <= nextPatientId) {
        insertText('Det här var din första patient, men vi kan börja om.', 'tell');
        nextPatientId = 1;
    }

    currentPatient=cases[--nextPatientId];
    setupPatient();
}

function nextHistory() {
    if (!currentPatient) { insertText('Du måste först ropa in en patient.'); };
    if (!currentPatient.nextHistory) { currentPatient.nextHistory = 0; };
    if (currentPatient.nextHistory >= currentPatient.history.length) {
        insertText('Jag har inget mer att säga', 'say');
    } else {
        insertText(currentPatient.history[currentPatient.nextHistory++], 'say');
    }
}

function listTests() {
    let txt = standardTests.reduce( (t,a) => t+=`<li>${a.key}`, '<b>Tillgängliga tester:</b><br><ul>');
    txt += '</ul>';
    return txt;
}

function mergeTests() {
    let tests = [];
    if (currentPatient) tests = currentPatient.tests;
    standardTests.forEach( t => { if (!tests.find( te => t.key == te.key )) tests.push(t); });
    return tests;
}

function issueTests(params) {
    if (!params || params.length == 0) {
        insertText("Du måste ange ett test. Skriv 'test lista' för att se vilka tester som finns.", 'tell');
        return;
    }
    if (params[0].startsWith('list')) {
        insertText(listTests(), 'tell');
        return;
    }
    
    let tsts = mergeTests();
    let results = params.map( p => {
        let sel = tsts.find( t => t.key.toLowerCase().startsWith(p) );
        if (sel) {
            return `<li>Test: <b>${sel.key}</b> värde: <i>${sel.value}</i>`;
        } else {
            return `<li>kan inte genomföra test ${p}`;
        }
    }).reduce( (t,a) => t+=a, `<b>Resultat från provtagning:</b><ul>`);
    results += '</ul>'
    insertText(results, 'tell');
}

function diagnosis(params) {
    if (0 == params.length) {
        insertText('Vilken diagnos vill du ställa?', 'tell');
    } else if (!currentPatient) {
        insertText('Du bör ha en patient hos dig innan du ställer en diagnos.', 'tell');        
    } else {
        let d = currentPatient.resolutions.find( r => r.key == 'diagnos');
        insertText(`Din diagnos är: ${params}<br>
Patientens verkliga diagnos är: ${d.value}<br>
Kommentar: ${d.feedback}<br><br>
Vad föreslår du för behandling?`);
        currentPatient.isDiagnosed = true;
    }
}

function listTreatments() {
    let txt = currentPatient.resolutions.reduce( (t,a) => t+=`<li>${a.key}`, '<b>Tillgängliga behandlingar:</b><br><ul>');
    txt += '</ul>';
    return txt;
}

function suggestTreatment(params) {
    if (!currentPatient) {
        insertText('Du bör ha en patient hos dig innan du föreslår en behandling.', 'tell');
        return;
    }
    if (!params || params.length == 0) {
        insertText("Du måste ange en behandling. Skriv 'behandling lista' för att se vilka behandlingar som är möjliga.", 'tell');
        return;
    }
    if (params[0].startsWith('list')) {
        insertText(listTreatments(), 'tell');
        return;
    }

    let treatments = params
        .map( p => currentPatient.resolutions.filter( r => r.key.toLowerCase().startsWith(p) ) )
        .flat();

    if (0 == treatments.length) {
        insertText("Hittar inga behandlingar med det namnet. Skriv 'behandling lista' för att se vilka behandlingar som är möjliga.", 'tell');
    } else {
        treatments = treatments.reduce( (t,a) => t+=`<li>Behandling <b>${a.key}</b>: ${a.feedback}` , '<b>Kommentarer till dina behandlingar:</b><ul>');
        treatments +='</ul>';
        insertText(treatments,'tell');
    }
}

// Frontend Functions
// --------------------
function sendAction() {
    let at = document.getElementById('actionText');
    parseAndExecuteAction(at.value);
    at.value='';
}

function enterAction(evt) {
    if (evt && evt.key == 'Enter') sendAction();
}

function insertText(theText, theType='say') {
    let area = document.getElementById('textArea');
    if (!area) { return; }

    let element = document.createElement('div');
    element.innerHTML = theText;
    element.className = 'textItem ' + theType || '';

    area.appendChild(element);
    element.scrollIntoView({behavior: 'smooth'});
}

function setHeader(theHeader) {
    let header = document.getElementById('titleRow');
    if (!header) { return; }
    header.innerHTML = theHeader;
}


// Setup and get Started
// --------------------

function setupButtons() {
    let send = document.getElementById('actionSend');
    let help = document.getElementById('actionHelp');
    let at = document.getElementById('actionText');

    if (send) send.addEventListener('click', sendAction);
    if (help) help.addEventListener('click', printHelp);
    if (at) {
        at.addEventListener('keyup', enterAction);
        at.focus();
    };

}

setupButtons();
setHeader('-- Ingen Patient Vald --');

// Some tests
// --------------------
printHelp();

