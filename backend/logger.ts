export enum LogSource {
    Database = "DATABASE",
    Crawler = "CRAWLER",
    Http = "HTTP",
    Parser = "PARSER"
}

export enum LogType {
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

export function error(source: LogSource, message: string) {
    let formattedMessage = formatMessage(message); 
    console.log(`${new Date().toISOString()} - [${source}/${LogType.Error}]: ${formattedMessage}`); 
}
export function info(source: LogSource, message: string) {
    let formattedMessage = formatMessage(message); 
    console.log(` ${new Date().toISOString()} - [${source}/${LogType.Info}]:  ${formattedMessage}`);
}
export function warn(source: LogSource, message: string) {
    let formattedMessage = formatMessage(message); 
    console.log(`${new Date().toISOString()} - [${source}/${LogType.Warning}]: ${formattedMessage}`);
}
