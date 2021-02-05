const BASE_API_URL = "https://jservice.io/api/";
const NUM_CATEGORIES = 6;
const NUM_CLUES_PER_CAT = 5;
// categories is the main data structure for the app; it looks like this:
let categories = [];


/** Get NUM_CATEGORIES random category from API.*/
async function getCategoryIds() {
    let response = await axios.get(`${BASE_API_URL}categories?count=100`);
    let catIds = response.data.map(c => c.id);
    return _.sampleSize(catIds, NUM_CATEGORIES);
}


/** Return object with data about a category: */
async function getCategory(catId) {
    let response = await axios.get(`${BASE_API_URL}category?id=${catId}`);
    let cat = response.data;
    let allClues = cat.clues;
    let randomClues = _.sampleSize(allClues, NUM_CLUES_PER_CAT);
    let clues = randomClues.map(c => ({
        question: c.question,
        answer: c.answer,
        showing: null,
    }));
    return { title: cat.title, clues };
}

/** Fill the HTML table#jeopardy with the categories & cells for questions. */
async function fillTable() {
// Add row with headers for categories
    $("#jeopardy thead").empty();
    let $tr = $("<tr>");
    for (let catIdx = 0; catIdx < NUM_CATEGORIES; catIdx++) {
        $tr.append($("<th>").text(categories[catIdx].title));
    }
    $("#jeopardy thead").append($tr);

// Add rows with questions for each category
    $("#jeopardy tbody").empty();
    for (let clueIdx = 0; clueIdx < NUM_CLUES_PER_CAT; clueIdx++) {
        let $tr = $("<tr>");
        for (let catIdx = 0; catIdx < NUM_CATEGORIES; catIdx++) {
        $tr.append($("<td>").attr("id", `${catIdx}-${clueIdx}`).text("?"));
        }
        $("#jeopardy tbody").append($tr);
    }
}


/** Handle clicking on a clue: show the question or answer.*/
function handleClick(evt) {
    let id = evt.target.id;
    let [catId, clueId] = id.split("-");
    let clue = categories[catId].clues[clueId];
    let msg;

    if (!clue.showing) {
        msg = clue.question;
        clue.showing = "question";
    } else if (clue.showing === "question") {
        msg = clue.answer;
        clue.showing = "answer";
    } else {
      // ignore already showing answers
        return
    }
    // Update text of cell
    $(`#${catId}-${clueId}`).html(msg);
};

//Page Loader.
document.onreadystatechange = function() { 
    if (document.readyState !== "complete") { 
        document.querySelector( 
            "#jGame").style.visibility = "hidden"; 
        document.querySelector( 
            "#loader").style.visibility = "visible"; 
    } else { 
        document.querySelector( 
            "#loader").style.display = "none"; 
        document.querySelector( 
            "#jGame").style.visibility = "visible"; 
    } 
}; 


// Start game.
async function setupAndStart() {
    let catIds = await getCategoryIds();
    categories = [];
    for (let catId of catIds) {
        categories.push(await getCategory(catId));
    }
    fillTable();
};


// On click of restart button, restart game.
$("#restart").on("click", setupAndStart);


// Setup, start & add event handler for clicking clues on Page load.
$(async function () {
    setupAndStart();
    $("#jeopardy").on("click", "td", handleClick);
});
