const data = await getStories();
attachSources(data, "AO3");

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

        let title = createTableCell(row.title, "titleData", false);    
        let author = createTableCell(row.author, "authorData", false);
        let chapters = createTableCell(row.chapters_released, "chaptersData", true);
        let updated = createTableCell(row.updated, "updatedData", false);
        let fandom = createTableCell(row.fandom, "fandomData", false);

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
    console.log(data[0])

    const cellsArray = Array.from(titleCells);

    let i = 0;

    for (const cell of cellsArray) {
        appendNewLabel(cell, data[i].url, imgUrl)

        // this should work for when there are more than 1 source for a story
        if (i > 1) {
            let storyId = data[i].story_id;
            let prevStoryId = data[i - 1].story_id;

            while (storyId === prevStoryId) {
                appendNewLabel(cell, data[i].url, label)                
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

    
    aElement.appendChild(imgElement)
    cell.appendChild(aElement)
}

