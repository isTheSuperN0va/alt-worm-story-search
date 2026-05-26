fetch("/api/stories").then((res) => res.json()).then(data => addDataToTable(data));

const table = document.getElementById("tableBody")

function addDataToTable(data) {
    for (const row of data) {
        tableRow = document.createElement("tr");
        tableRow.classList.add("tableData");

        let title = createTableCell(row.title, "titleData", false);    
        let author = createTableCell(row.author, "authorData", false);
        let chapters = createTableCell(row.chapters_released, "chaptersData", true);
        let updated = createTableCell(row.updated, "updatedData", false);
        let fandom = createTableCell(row.fandom, "fandomData", false);

        tableRow.appendChild(title);
        tableRow.appendChild(author);
        tableRow.appendChild(chapters);
        tableRow.appendChild(updated);
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

