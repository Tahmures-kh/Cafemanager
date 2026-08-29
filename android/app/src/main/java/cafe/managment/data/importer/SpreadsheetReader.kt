package cafe.managment.data.importer

import org.dhatim.fastexcel.reader.ReadableWorkbook
import java.io.InputStream

/**
 * Reads a header row + data rows from a spreadsheet into maps of header-name -> cell text,
 * mirroring what XLSX.utils.sheet_to_json produces on the web (see lib/recipe-excel.ts /
 * lib/sales-excel.ts, which key off these same maps).
 */
object SpreadsheetReader {

    fun readXlsx(input: InputStream): List<Map<String, String>> {
        ReadableWorkbook(input).use { workbook ->
            val sheet = workbook.firstSheet
            val rows = sheet.read()
            if (rows.isEmpty()) return emptyList()

            val header = rows[0]
            val headerNames = (0 until header.cellCount).map { header.getCellText(it).trim() }

            return rows.drop(1)
                .filter { row -> (0 until row.cellCount).any { row.getCellText(it).isNotBlank() } }
                .map { row ->
                    headerNames.mapIndexed { index, name -> name to (if (index < row.cellCount) row.getCellText(index) else "") }
                        .toMap()
                }
        }
    }

    fun readCsv(text: String): List<Map<String, String>> {
        val lines = text.lineSequence().map { it.trim() }.filter { it.isNotEmpty() }.toList()
        if (lines.isEmpty()) return emptyList()

        val delimiter = if (lines[0].count { it == ';' } > lines[0].count { it == ',' }) ';' else ','
        val headerNames = lines[0].split(delimiter).map { it.trim() }

        return lines.drop(1).map { line ->
            val cells = line.split(delimiter)
            headerNames.mapIndexed { index, name -> name to (cells.getOrNull(index)?.trim() ?: "") }.toMap()
        }
    }
}
