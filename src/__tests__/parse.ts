import { DocumentNode, GraphQLError, Source, parse } from "graphql";
import { parseFn } from "../";
import test from "ava";

test("loading document node when document id parsed from query", async (t): Promise<void> => {
    const myDocument = parse(new Source("{ test }"));
    const myParse = await parseFn({
        graphQLParams: {
            operationName: undefined,
            query: " # doc:this_is/MY:doc.ument-id ",
            raw: undefined,
            variables: undefined,
        },
        loadDocumentFn: async (_: string): Promise<DocumentNode> => {
            return myDocument;
        },
    });
    t.is(myParse(new Source("---")), myDocument);
});

test("throwing error from load document will throw when parseFn result is called", async (t): Promise<void> => {
    // We shouldn't throw when creating the parse function.
    const myParse = await parseFn({
        graphQLParams: {
            operationName: undefined,
            query: " # doc:abcdef-ABCDEF/1234567890 ",
            raw: undefined,
            variables: undefined,
        },
        loadDocumentFn: async (id: string): Promise<DocumentNode> => {
            throw new GraphQLError(`Unable to load document ${id}`);
        },
    });
    // The throw should be deferred until the parse function is used.
    const err = t.throws<GraphQLError>((): DocumentNode => myParse(new Source("----")));
    t.is(err.message, "Unable to load document abcdef-ABCDEF/1234567890");
});

test("fallback to customParseFn when unable to parse document id", async (t): Promise<void> => {
    let calledCustomParseFn = false;
    const myDocument = parse(new Source("{ test }"));
    const myParse = await parseFn({
        customParseFn: (): DocumentNode => {
            calledCustomParseFn = true;
            return myDocument;
        },
        graphQLParams: {
            operationName: undefined,
            query: "----",
            raw: undefined,
            variables: undefined,
        },
        loadDocumentFn: async (_: string): Promise<DocumentNode> => {
            throw new Error("Shouldn't have been called");
        },
    });
    t.is(myParse(new Source("---")), myDocument);
    t.is(calledCustomParseFn, true, "Expected to have customParseFn called");
});