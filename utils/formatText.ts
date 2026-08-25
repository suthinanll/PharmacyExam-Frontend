/**
 * Utility for formatting scientific text, chemical formulas, and mathematical notation
 * Supports automatic superscript (^) and subscript (_) conversion to HTML <sup> and <sub>.
 *
 * Examples:
 *  - H_2O           -> H<sub>2</sub>O
 *  - CO_{2}         -> CO<sub>2</sub>
 *  - Ca^{2+}        -> Ca<sup>2+</sup>
 *  - Ca^2+          -> Ca<sup>2+</sup>
 *  - 10^{-3}        -> 10<sup>-3</sup>
 *  - mg/m^2         -> mg/m<sup>2</sup>
 *  - SO_4^{2-}      -> SO<sub>4</sub><sup>2-</sup>
 */

export function formatScientificText(text: string | null | undefined): string {
    if (!text) return "";

    let formatted = text;

    // 1. Bracketed superscripts: ^{2+}, ^{-3}, ^{x+1} -> <sup>...</sup>
    formatted = formatted.replace(/\^{([^}]+)}/g, "<sup>$1</sup>");

    // 2. Bracketed subscripts: _{2}, _{max}, _{1/2} -> <sub>...</sub>
    formatted = formatted.replace(/_{([^}]+)}/g, "<sub>$1</sub>");

    // 3. Simple superscripts: ^2+, ^2-, ^2, ^-3, ^+ -> <sup>...</sup>
    // (Matches alphanumeric and signs right after ^)
    formatted = formatted.replace(/\^([0-9]+[+-]?|[+-][0-9]*|[a-zA-Z]+)/g, "<sup>$1</sup>");

    // 4. Simple subscripts in chemical/scientific formulas: H_2, O_2, C_6H_12O_6 -> <sub>...</sub>
    formatted = formatted.replace(/_([0-9]+[+-]?|[a-zA-Z0-9]+)/g, "<sub>$1</sub>");

    return formatted;
}

export default formatScientificText;
