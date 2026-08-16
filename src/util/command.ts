/**
 * Allowlista komend dla warstwy efektów.
 *
 * Kontrakt: komenda przechodzi tylko wtedy, gdy jest pojedynczym wywołaniem bez
 * żadnej składni powłoki, a jej początkowe tokeny są dokładnie jednym wpisem
 * allowlisty. Wpis allowlisty może być wielowyrazowy (`git status`, `make test`).
 * Dopasowanie prefiksu na surowym stringu jest niewystarczające, bo
 * `make test && curl ...` również zaczyna się od `make test `.
 */

export interface CommandVerdict {
  ok: boolean;
  reason?: string;
  code?: 'EMPTY' | 'TOO_LONG' | 'SHELL_SYNTAX' | 'CONTROL_CHAR' | 'NOT_ALLOWED' | 'UNSAFE_ARGUMENT';
}

const MAX_LENGTH = 512;

/** Znaki, które w powłoce oznaczają cokolwiek innego niż literał argumentu. */
const SHELL_SYNTAX = /[;&|<>$`\\!*?(){}\[\]"'~#]/;

/** Znaki sterujące, w tym nowa linia i tabulator. */
const CONTROL_CHARACTER = /[\u0000-\u001f\u007f]/;

/** Argument dopuszczalny po dopasowanym wpisie allowlisty. */
const SAFE_ARGUMENT = /^-{0,2}[A-Za-z0-9][A-Za-z0-9._/=:@+-]*$/;

export function tokenizeCommand(command: string): string[] {
  return command.trim().split(/\s+/).filter(Boolean);
}

export function checkCommand(command: unknown, allowedCommands: string[]): CommandVerdict {
  if (typeof command !== 'string' || command.trim().length === 0) {
    return { ok: false, code: 'EMPTY', reason: 'Komenda musi być niepustym stringiem.' };
  }
  if (command.length > MAX_LENGTH) {
    return { ok: false, code: 'TOO_LONG', reason: `Komenda przekracza ${MAX_LENGTH} znaków.` };
  }
  if (CONTROL_CHARACTER.test(command)) {
    return { ok: false, code: 'CONTROL_CHAR', reason: 'Komenda zawiera znak sterujący.' };
  }
  const syntax = SHELL_SYNTAX.exec(command);
  if (syntax) {
    return { ok: false, code: 'SHELL_SYNTAX', reason: `Komenda zawiera składnię powłoki: ${JSON.stringify(syntax[0])}.` };
  }

  const tokens = tokenizeCommand(command);
  for (const allowed of allowedCommands) {
    const allowedTokens = tokenizeCommand(allowed);
    if (allowedTokens.length === 0 || allowedTokens.length > tokens.length) continue;
    if (!allowedTokens.every((token, index) => token === tokens[index])) continue;

    const extra = tokens.slice(allowedTokens.length);
    const unsafe = extra.find((argument) => !SAFE_ARGUMENT.test(argument));
    if (unsafe !== undefined) {
      return { ok: false, code: 'UNSAFE_ARGUMENT', reason: `Niedozwolony argument: ${JSON.stringify(unsafe)}.` };
    }
    return { ok: true };
  }
  return { ok: false, code: 'NOT_ALLOWED', reason: `Komenda spoza allowlisty: ${JSON.stringify(command)}.` };
}

export function isAllowedCommand(command: unknown, allowedCommands: string[]): boolean {
  return checkCommand(command, allowedCommands).ok;
}
