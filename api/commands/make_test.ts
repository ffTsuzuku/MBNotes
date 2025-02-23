import { existsSync } from "https://deno.land/std/fs/mod.ts";
import { join } from "https://deno.land/std/path/mod.ts";
import chalk from "chalk"

const template = `import {assertEquals, assertGreater } from 'jsr:@std/assert'
import { describe, it } from "jsr:@std/testing/bdd";
import {make_mock_json_db_adapter, make_mock_query} from '../core/utility/test.ts';

describe({name: 'example', ignore: false}, () => {
	it({name: 'testing test', ignore: false}, () => {
		assertEquals(1,1)
	})
})
`;

const main = async () => {
    try {
        const test_name = Deno.args[0];
        if (!test_name) {
            throw new Error("Please specify a model name.");
        }

        const TEST_PATH = join(Deno.cwd(), "tests", `${test_name}_test.ts`);

        if (existsSync(TEST_PATH)) {
            throw new Error("Test already exists");
        }

        await Deno.writeTextFile(TEST_PATH, template);
		console.log(chalk.green.bold(`✅ Test ${test_name} created successfully at ${TEST_PATH}.ts`));
    } catch (e: any) {
		console.error(chalk.red.bold(`❌ Failed to create model: ${e.message}`));
    }
};

main();
