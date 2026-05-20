export enum LogSource {
    Database = "DATABASE",
    Crawler = "CRAWLER",
    Http = "HTTP",
    Parser = "PARSER"
}

export enum LogType {
    Error = "Error",
    Warning = "Warning",
    Info = "Info"
}

export function error(source: LogSource, message: string) { console.log(`[${source}] ${LogType.Error}: ${message}`); }
export function info(source: LogSource, message: string) { console.log(`[${source}] ${LogType.Info}: ${message}`);}
export function warn(source: LogSource, message: string) { console.log(`[${source}] ${LogType.Warning}: ${message}`);}
