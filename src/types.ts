export type Input = {
    name: string;
    namespace: string;
    chart: {
        name: string;
        repo: string;
        version: string;
    };
}