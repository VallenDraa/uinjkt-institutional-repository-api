export class PromiseHelper {
  static handleAllSettled<T>(results: Array<PromiseSettledResult<T>>) {
    return results.map((result) =>
      result.status === 'fulfilled' ? result.value : null,
    );
  }
}
