import test from "ava";
import { parseFn } from "../";
import { Source, GraphQLError, DocumentNode, parse } from "graphql";

test("Loading document node when document id parsed from query", async (t): Promise<void> => {
    const myDocument = parse(new Source("{ test }"));
    const myParse = await parseFn({
        loadDocumentFn: async (_: string): Promise<DocumentNode> => {
            return myDocument;
        },
        params: {
            operationName: undefined,
            query: " # ID:ab12 ",
            raw: undefined,
            variables: undefined,
        }
    });
    t.is(myParse(new Source("---")), myDocument);
});

test("Throwing error from load document will throw when parseFn result is called", async (t): Promise<void> => {
    // We shouldn't throw when creating the parse function.
    const myParse = await parseFn({
        loadDocumentFn: async (id: string): Promise<DocumentNode> => {
            throw new GraphQLError(`Unable to load document ${id}`);
        },
        params: {
            operationName: undefined,
            query: " # ID:abcdefABCDEF1234567890 ",
            raw: undefined,
            variables: undefined,
        }
    });
    // The throw should be deferred until the parse function is used.
    const err = t.throws<GraphQLError>((): DocumentNode => myParse(new Source("----")));
    t.is(err.message, "Unable to load document abcdefABCDEF1234567890");
});

test("fallback to customParseFn when unable to parse document id", async (t): Promise<void> => {
    let calledCustomParseFn = false;
    const myDocument = parse(new Source("{ test }"));
    const myParse = await parseFn({
        customParseFn: (): DocumentNode => {
            calledCustomParseFn = true;
            return myDocument;
        },
        loadDocumentFn: async (_: string): Promise<DocumentNode> => {
            throw new Error("Shouldn't have been called");
        },
        params: {
            operationName: undefined,
            query: "----",
            raw: undefined,
            variables: undefined,
        }
    });
    t.is(myParse(new Source("---")), myDocument);
    t.is(calledCustomParseFn, true, "Expected to have customParseFn called");
});