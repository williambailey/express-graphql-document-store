import { DocumentNode, Source, parse } from "graphql";
import { GraphQLParams } from "express-graphql";

const idRegex = /^\s*#\s*doc:\s*(?<documentId>[A-Za-z0-9_/:.-]+)\s*$/;

function documentId(graphQLParams: GraphQLParams | undefined): string | undefined {
    if (graphQLParams && typeof (graphQLParams.query) === "string") {
        const match = graphQLParams.query.match(idRegex);
        if (match && match.groups && typeof (match.groups.documentId) === "string") {
            return match.groups.documentId;
        }
    }
    return undefined;
}

export interface ParseFnOptions {
    customDocumentIdFn?: (graphQLParams: GraphQLParams | undefined) => string | undefined;
    customParseFn?: (source: Source) => DocumentNode;
    graphQLParams: GraphQLParams | undefined;
    loadDocumentFn: (id: string) => Promise<DocumentNode>;
}

export async function parseFn(options: ParseFnOptions): Promise<(source: Source) => DocumentNode> {
    const documentIdFn = options.customDocumentIdFn || documentId;
    const id = documentIdFn(options.graphQLParams);
    if (typeof (id) === "string") {
        try {
            const document = await options.loadDocumentFn(id);
            return (_: Source): DocumentNode => document;
        } catch (e) {
            return (_: Source): DocumentNode => { throw e };
        }
    }
    return options.customParseFn || parse;
}
