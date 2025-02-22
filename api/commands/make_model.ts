import { existsSync } from "https://deno.land/std/fs/mod.ts";
import { join } from "https://deno.land/std/path/mod.ts";
import chalk from "chalk"

const template = `import BaseModel from './Model.ts'

export default class %1% extends BaseModel {
	constructor(attributes: Record<string, any>) {
		super(attributes)
	}
}`;

const main = async () => {
    try {
        const model_name = Deno.args[0];
        if (!model_name) {
            throw new Error("Please specify a model name.");
        }
		const populated_template = template.replace("%1%", model_name)

        const MODEL_PATH = join(Deno.cwd(), "models", `${model_name}.ts`);

        if (existsSync(MODEL_PATH)) {
            throw new Error("Model already exists");
        }

        await Deno.writeTextFile(MODEL_PATH, populated_template);
		console.log(chalk.green.bold(`✅ Model ${model_name} created successfully at ${MODEL_PATH}.ts`));
    } catch (e) {
		console.error(chalk.red.bold(`❌ Failed to create model: ${e.message}`));
    }
};

main();
