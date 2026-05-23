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

export function error(source: LogSource, message: string) { console.log(`${new Date().toISOString()} - [${source}/${LogType.Error}]: ${message}`); }
export function info(source: LogSource, message: string) { console.log(` ${new Date().toISOString()} - [${source}/${LogType.Info}]:  ${message}`);}
export function warn(source: LogSource, message: string) { console.log(`${new Date().toISOString()} - [${source}/${LogType.Warning}]: ${message}`);}
