export function getBoolean(key: string, defaultValue: boolean): boolean {
	let string = (globalThis as any)?.process?.env[key];
	try {
		let json = JSON.parse(string);
		if (typeof json === "boolean") {
			return json;
		}
	} catch (error) {}
	return defaultValue;
};

export const DEBUG = getBoolean("DEBUG", false);
