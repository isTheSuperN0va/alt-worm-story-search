const MILISECONDS_IN_MINUTE = 60000;
const MINUTES_IN_HOUR = 60;
const HOURS_IN_DAY = 24;

const data = await getStories();
attachSources(data, "source/ao3");

async function getStories() {
    const stories = await fetch("/api/stories", {
    method: 'POST',
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        amount: 50, 
    })
    });

    const data = await stories.json();
    addDataToTable(data)
    return data;
}


function addDataToTable(data) {
    let table = document.getElementById("tableBody")

    for (const row of data) {
        let tableRow = document.createElement("tr");
        tableRow.classList.add("tableData");

        let updated = createTableCell(humanDate(row.updated), "updatedData", false);
        let title = createTableCell(row.title, "titleData", false);    
        let author = createTableCell(row.author, "authorData", false);
        let chapters = createTableCell(row.chapters, "chaptersData", true);
        let wordcount = createTableCell(humanWordcount(row.wordcount), "wordcountData", true);
        let fandom = createTableCell(row.fandom, "fandomData", false);

        tableRow.appendChild(updated);
        tableRow.appendChild(title);
        tableRow.appendChild(author);
        tableRow.appendChild(chapters);
        tableRow.appendChild(wordcount);
        tableRow.appendChild(fandom);

        table.appendChild(tableRow)
    }
}

function createTableCell(data, className, centered) {
    let cell = document.createElement("td")
    cell.classList.add(className)

    let cellSpan = document.createElement("span");
    cellSpan.textContent = data;
    cell.appendChild(cellSpan)
    if (centered) cellSpan.classList.add("centered")
    
    return cell;
}

function attachSources(data, imgUrl) {
    const titleCells = document.getElementsByClassName("titleData")

    const cellsArray = Array.from(titleCells);

    let i = 0;

    for (const cell of cellsArray) {
        appendNewLabel(cell, data[i].url, imgUrl)

        // this should work for when there are more than 1 source for a story
        if (i > 1) {
            let storyId = data[i].story_id;
            let prevStoryId = data[i - 1].story_id;

            while (storyId === prevStoryId) {
                appendNewLabel(cell, data[i].url, imgUrl)                
                i++;                
            }
        }
        
        i++;
    }
}

function appendNewLabel(cell, url, imgUrl) {
    let aElement = document.createElement("a");
    let imgElement = document.createElement("img");

    aElement.setAttribute("href", url);
    aElement.setAttribute("target", "_blank");
    aElement.classList.add("source")

    imgElement.setAttribute("src", imgUrl);
    imgElement.setAttribute('title', "AO3");
    
    aElement.appendChild(imgElement)
    cell.appendChild(aElement)
}

function humanDate(datetime) {


    let target = new Date(datetime);
    let now = new Date()

    const deltaMiliseconds = now - target;

    const deltaMinutes = Math.floor(deltaMiliseconds / MILISECONDS_IN_MINUTE);
    const deltaHours = Math.floor(deltaMinutes / MINUTES_IN_HOUR);
    const deltaDays = Math.floor(deltaHours / HOURS_IN_DAY);

    if (deltaDays == 0)
        return humanHours(deltaHours, deltaMinutes);

    if (deltaDays == 1)
        return "Yesterday"

    if (deltaDays <= 14)
        return `${deltaDays} days ago`

    return datetime;
}

function humanHours(deltaHours, deltaMinutes) {

    if (deltaHours == 0) {
        return humanMinutes(deltaMinutes); 
    }
        
    return `${deltaHours} hours ago`;
}

function humanMinutes(deltaMinutes) {
    if (deltaMinutes == 0)
        return "Just Now";

    return `${deltaMinutes} minutes ago`
}

function humanWordcount(wordcount) {
    let wordcountNumber = Number(wordcount);

    if (wordcount >= 1000 && wordcount < 1000000) {
        wordcountNumber = Math.floor(wordcountNumber / 1000);
        wordcount = String(wordcountNumber) + "k";
    }
    if (wordcount >= 1000000) {
        wordcountNumber = Math.floor(wordcountNumber / 1000000.0);
        wordcount = String(wordcountNumber) + "m";
    }

    return wordcount
}