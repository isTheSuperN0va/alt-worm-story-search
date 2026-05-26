fetch("/api/stories").then((res) => res.json()).then(data => addDataToTable(data));

const table = document.getElementById("searchTable")

function addDataToTable(data) {
    for (const row of data) {
    tableRow = document.createElement("tr");
    tableRow.classList.add("tableData");

    let title = document.createElement("td")
    title.textContent = row.title;
    let author = document.createElement("td")
    author.textContent = row.author;
    let chapters = document.createElement("td")
    chapters.textContent = row.chapters_released;
    let updated = document.createElement("td")
    updated.textContent = row.updated;
    let fandom = document.createElement("td")
    fandom.textContent = row.fandom;

    tableRow.appendChild(title);
    tableRow.appendChild(author);
    tableRow.appendChild(chapters);
    tableRow.appendChild(updated);
    tableRow.appendChild(fandom);

    table.appendChild(tableRow)
    }
}

