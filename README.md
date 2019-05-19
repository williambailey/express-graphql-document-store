GraphQL persisted document loader for [`express-graphql`](https://www.npmjs.com/package/express-graphql)
=======================================================

This library provides a mechanism to bring persisted documents/queries to [`express-graphql`](https://www.npmjs.com/package/express-graphql).

## How it works

This library inspects the incoming request and attempt to extract a document id. If a document id is found then it will attempt to turn that document id into a GraphQL `DocumentNode`. If a document id is not found then it will fall back to the standard GraphQL request processing behavior and the request will be processed as normal.

### Document ID

By default, the document id is specified _**in place**_ of a GraphQL query. The syntax for a document id is `# doc:<id>`. Where `<id>` matches the regular expression `/^[A-Za-z0-9_/:.-]+$/`

Lets say that you have a query document that has an identifier of `my-graphql-client-app/db4c246cf411`. Your GraphQL query will then be:

```gql
# doc:my-graphql-client-app/db4c246cf411
```

To GraphQL clients this should look like nothing more then an empty query and a comment. This should allow you to continue to use tooling such as [`graphiql`](https://github.com/graphql/graphiql) and [`insomnia`](https://insomnia.rest/) without workarounds or modification.

## Using the library

Use the `parseFn` function to provide a `customParseFn` to `express-graphql`.

`parseFn(options: ParseFnOptions): Promise<(source: Source) => DocumentNode>`

### Options

The `parseFn` function accepts the following options:

* **`customDocumentIdFn?: (graphQLParams: GraphQLParams | undefined) => string | undefined;`** - An optional function which will be used to extract the document id from the provided `graphQLParams` instead of the default.
* **`customParseFn?: (source: Source) => DocumentNode;`** - An optional function which will be used as a fallback create a document instead of the default `parse` from `graphql-js` when the library is unable to extract a document id.
* **`graphQLParams: GraphQLParams | undefined;`** - The parameters as provided by `express-graphql`.
* **`loadDocumentFn: (id: string) => Promise<DocumentNode>;`** - A function which will be used to convert the extracted document id into a `DocumentNode`. If the provided document id is invalid then this function is expected to throw a `GraphQLError`.

### Example

```ts
import { DocumentNode, GraphQLError, GraphQLObjectType, GraphQLSchema, GraphQLString, Source, parse } from "graphql";
import express from "express";
import graphqlHTTP from "express-graphql";
import { parseFn } from "express-graphql-document-store";

const app = express();
const port = 3000;

const schema = new GraphQLSchema({
    query: new GraphQLObjectType({
        fields: {
            hello: {
                resolve: (): string => "world",
                type: GraphQLString,
            },
        },
        name: "Query",
    }),
});

const documents = new Map<string, DocumentNode>();
documents.set(
    "my-graphql-client-app/db4c246cf411",
    parse(new Source(
        "{ hello }",
        "Persisted document my-graphql-client-app/db4c246cf411",
    )),
)

app.use('/graphql', graphqlHTTP(async (request, response, graphQLParams) => ({
    customParseFn: await parseFn({
        graphQLParams,
        loadDocumentFn: async (id: string) => {
            const ast = documents.get(id);
            if (ast === undefined) {
                throw new GraphQLError("Document Identification Error: Unable to load requested document");
            }
            return ast;
        },
    }),
    schema,
})));

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
```
