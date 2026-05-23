export enum Source {
    Database = "DATABASE",
    Crawler = "CRAWLER",
    Http = "HTTP",
    Parser = "PARSER"
}

export enum Type {
    Error = "\x1b[31mError\x1b[0m",
    Warning = "\x1b[33mWarning\x1b[0m",
    Info = "\x1b[34mInfo\x1b[0m"
}

function formatMessage(message: string): string {
    const lastChar = message[message.length - 1];

    if (lastChar == ".")
        message.replace(".", ";");

    if (lastChar != ";")
        message += ";";

    return message;
}

export function error(source: Source, message: string) {
    let formattedMessage = formatMessage(message); 
    console.log(`${new Date().toISOString()} - [${source}/${Type.Error}]: ${formattedMessage}`); 
}
export function info(source: Source, message: string) {
    let formattedMessage = formatMessage(message); 
    console.log(` ${new Date().toISOString()} - [${source}/${Type.Info}]:  ${formattedMessage}`);
}
export function warn(source: Source, message: string) {
    let formattedMessage = formatMessage(message); 
    console.log(`${new Date().toISOString()} - [${source}/${Type.Warning}]: ${formattedMessage}`);
}
