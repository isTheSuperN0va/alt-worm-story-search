export enum Source {
    Database = "DATABASE",
    Crawler = "CRAWLER",
    Http = "HTTP",
    Parser = "PARSER"
}

export enum Type {
    Error = "\x1b[31mError\x1b[0m",
    Success = "\x1b[32mError\x1b[0m",
    Warning = "\x1b[33mWarning\x1b[0m",
    Info = "\x1b[34mInfo\x1b[0m"
}

export function error(source: Source, message: string) { console.log(`${new Date().toISOString()} - [${source}/${Type.Error}]: ${message}`); }
export function info(source: Source, message: string) { console.log(` ${new Date().toISOString()} - [${source}/${Type.Info}]:  ${message}`);}
export function warn(source: Source, message: string) { console.log(`${new Date().toISOString()} - [${source}/${Type.Warning}]: ${message}`);}
export function success(source: Source, message: string) { console.log(`${new Date().toISOString()} - [${source}/${Type.Success}]: ${message}`) }