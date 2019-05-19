import { DocumentNode, Source, parse } from "graphql";
import { GraphQLParams } from "express-graphql";

const idRegex = /^\s*#\s*ID:\s*(?<documentId>[a-fA-F0-9]+)\s*$/;

export interface ParseFnOptions {
    customParseFn?: (source: Source) => DocumentNode;
    loadDocumentFn: (id: string) => Promise<DocumentNode>;
    params: GraphQLParams;
}

export async function parseFn(options: ParseFnOptions): Promise<(source: Source) => DocumentNode> {
    if (typeof (options.params.query) === "string") {
        const match = options.params.query.match(idRegex);
        if (match && match.groups && typeof (match.groups.documentId) === "string") {
            try {
                const document = await options.loadDocumentFn(match.groups.documentId);
                return (_: Source): DocumentNode => document;
            } catch (e) {
                return (_: Source): DocumentNode => { throw e };
            }
        }
    }
    return typeof (options.customParseFn) === "function" ? options.customParseFn : parse;
}
