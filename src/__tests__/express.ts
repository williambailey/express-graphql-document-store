import { DocumentNode, GraphQLObjectType, GraphQLSchema, GraphQLString, Source, parse } from "graphql";
import { OptionsData } from "express-graphql";
import express from "express";
import graphqlHTTP from "express-graphql";
import { parseFn } from "..";
import request from "supertest";
import test from "ava";

test("integrating with express-graphql", async (t): Promise<void> => {
    let seenId: string | undefined;
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
    const app = express();
    app.use(
        '/graphql',
        graphqlHTTP(async (_, __, graphQLParams): Promise<OptionsData & { customParseFn: (source: Source) => DocumentNode }> => {
            const customParseFn = await parseFn({
                graphQLParams,
                loadDocumentFn: async (id: string): Promise<DocumentNode> => {
                    seenId = id;
                    return parse(new Source("{ hello }"));
                },
            });
            return {
                customParseFn,
                schema,
            };
        }),
    );
    const query = "# doc:this_is/MY:doc.ument-id";
    const response = await request(app).get(`/graphql?query=${encodeURIComponent(query)}`);
    t.is(seenId, "this_is/MY:doc.ument-id");
    t.is(response.status, 200);
    t.deepEqual(JSON.parse(response.text), { "data": { "hello": "world" } });
});
