import React, { useEffect, useState, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { PiExportBold } from 'react-icons/pi';
import { useFetchQuery } from '../../hooks/useFetchQuery';
import SelectBtn from '../buttons/SelectBtn';

const EXPORT_OPTIONS = [
    { value: 'excel', label: 'exportAsExcelWord' },
    { value: 'csv', label: 'exportAsCsvWord' },
    { value: 'json', label: 'exportAsJsonWord' },
];

// Utility functions
const formatValue = (value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') {
        return JSON.stringify(value, null, 2);
    }
    return String(value).trim();
};

const isValueEmpty = (value) => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (typeof value === 'object') {
        if (Array.isArray(value)) return value.length === 0;
        return Object.keys(value).length === 0;
    }
    return false;
};

const sanitizeSheetName = (name) => {
    // Excel sheet names have restrictions
    return name
        .replace(/[\[\]*?\/\\]/g, '') // Remove invalid characters
        .substring(0, 31); // Excel limit
};

export default function ExploreDataBtn({
    endpoint,
    dataFormat,
    queryName,
    fileName,
    getFullData = true,
    theParam
}) {
    const [fetchedData, setFetchedData] = useState(null);
    const [exportError, setExportError] = useState(null);

    // Fetch data
    const { data, isLoading, isError } = useFetchQuery(
        [...queryName],
        `${endpoint}${getFullData ? '?limit=full' : theParam}`
    );

    // Process data format
    useEffect(() => {
        if (data && dataFormat) {
            try {
                const keys = dataFormat.split('.');
                let value = data;

                for (const key of keys) {
                    value = value?.[key];
                }

                if (value !== undefined) {
                    setFetchedData(value);
                }
            } catch (error) {
                console.error('Error processing data format:', error);
                setExportError('Error processing data format');
            }
        }
    }, [data, dataFormat]);

    // Process data for export with better formatting
    const processDataForExport = useCallback((data) => {
        if (!data || !Array.isArray(data) || data.length === 0) {
            return [];
        }

        // Process each row
        const processedData = data.map(row => {
            const newRow = { ...row };

            Object.keys(newRow).forEach(key => {
                const value = newRow[key];

                // Format the value for better Excel display
                newRow[key] = formatCellValue(value);

                if (value !== null && value !== undefined && typeof value === 'object') {
                    if (Array.isArray(value)) {
                        newRow[key] = value.length > 0 ? JSON.stringify(value, null, 2) : null;
                    } else {
                        const keys = Object.keys(value);
                        newRow[key] = keys.length > 0 ? JSON.stringify(value, null, 2) : null;
                    }
                }
            });

            return newRow;
        });

        // Remove empty columns
        const emptyColumns = new Set();
        const allColumns = Object.keys(processedData[0] || {});

        allColumns.forEach(col => {
            const hasValue = processedData.some(row => {
                const value = row[col];
                return !isValueEmpty(value);
            });

            if (!hasValue) {
                emptyColumns.add(col);
            }
        });

        return processedData.map(row => {
            const newRow = { ...row };
            emptyColumns.forEach(col => delete newRow[col]);
            return newRow;
        });
    }, [formatCellValue]);

    // Enhanced Excel export with beautiful formatting
    const exportExcel = useCallback(() => {
        try {
            if (!fetchedData) {
                throw new Error('No data available for export');
            }

            const wb = XLSX.utils.book_new();

            // Define styles for beautiful formatting
            const headerStyle = {
                font: {
                    bold: true,
                    color: { rgb: "FFFFFF" },
                    size: 13,
                    name: "Arial"
                },
                fill: {
                    fgColor: { rgb: "2E75B6" } // Professional blue header
                },
                alignment: {
                    horizontal: "center",
                    vertical: "center",
                    wrapText: true
                },
                border: {
                    top: { style: "medium", color: { rgb: "1F4E79" } },
                    bottom: { style: "medium", color: { rgb: "1F4E79" } },
                    left: { style: "medium", color: { rgb: "1F4E79" } },
                    right: { style: "medium", color: { rgb: "1F4E79" } }
                }
            };

            const dataStyle = {
                font: {
                    size: 11,
                    color: { rgb: "2F2F2F" },
                    name: "Arial"
                },
                alignment: {
                    vertical: "center",
                    wrapText: true,
                    horizontal: "right"
                },
                border: {
                    top: { style: "thin", color: { rgb: "D0D0D0" } },
                    bottom: { style: "thin", color: { rgb: "D0D0D0" } },
                    left: { style: "thin", color: { rgb: "D0D0D0" } },
                    right: { style: "thin", color: { rgb: "D0D0D0" } }
                }
            };

            const alternateRowStyle = {
                ...dataStyle,
                fill: {
                    fgColor: { rgb: "F5F5F5" } // Very light gray alternate rows
                }
            };

            const totalRowStyle = {
                font: {
                    bold: true,
                    size: 11,
                    color: { rgb: "FFFFFF" },
                    name: "Arial"
                },
                fill: {
                    fgColor: { rgb: "70AD47" } // Green for totals
                },
                alignment: {
                    vertical: "center",
                    horizontal: "center",
                    wrapText: true
                },
                border: {
                    top: { style: "medium", color: { rgb: "548235" } },
                    bottom: { style: "medium", color: { rgb: "548235" } },
                    left: { style: "medium", color: { rgb: "548235" } },
                    right: { style: "medium", color: { rgb: "548235" } }
                }
            };

            const createStyledWorksheet = (data, sheetName) => {
                // Improve column headers for better readability
                const improvedData = data.map((row, index) => {
                    const improvedRow = {};
                    Object.keys(row).forEach(key => {
                        // Convert camelCase to readable text
                        const readableKey = key
                            .replace(/([A-Z])/g, ' $1')
                            .replace(/^./, str => str.toUpperCase())
                            .replace(/_/g, ' ')
                            .trim();
                        improvedRow[readableKey] = row[key];
                    });
                    return improvedRow;
                });

                const ws = XLSX.utils.json_to_sheet(improvedData);

                // Get the range of the worksheet
                const range = XLSX.utils.decode_range(ws['!ref']);

                // Apply styles to all cells
                for (let R = range.s.r; R <= range.e.r; ++R) {
                    for (let C = range.s.c; C <= range.e.c; ++C) {
                        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });

                        if (!ws[cellAddress]) {
                            ws[cellAddress] = { v: '', t: 's' };
                        }

                        // Apply header style to first row
                        if (R === 0) {
                            ws[cellAddress].s = headerStyle;
                        } else {
                            // Apply alternate row styling with zebra stripes
                            ws[cellAddress].s = R % 2 === 0 ? dataStyle : alternateRowStyle;
                        }
                    }
                }

                // Auto-size columns with better calculation
                const colWidths = [];
                for (let C = range.s.c; C <= range.e.c; ++C) {
                    let maxWidth = 0;
                    for (let R = range.s.r; R <= range.e.r; ++R) {
                        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                        const cell = ws[cellAddress];
                        if (cell && cell.v) {
                            // Calculate width based on content
                            let cellWidth = String(cell.v).length;

                            // Adjust for Arabic text (approximately 1.5x width)
                            if (/[\u0600-\u06FF]/.test(String(cell.v))) {
                                cellWidth = Math.ceil(cellWidth * 1.5);
                            }

                            // Adjust for JSON content
                            if (String(cell.v).includes('{') || String(cell.v).includes('[')) {
                                cellWidth = Math.min(cellWidth, 40); // Limit JSON width
                            }

                            maxWidth = Math.max(maxWidth, cellWidth);
                        }
                    }
                    // Set column width with better limits
                    colWidths[C] = Math.min(Math.max(maxWidth + 3, 12), 60);
                }

                ws['!cols'] = colWidths.map(width => ({
                    width,
                    customWidth: true
                }));

                // Set row heights for better appearance
                ws['!rows'] = [];
                for (let R = range.s.r; R <= range.e.r; ++R) {
                    ws['!rows'][R] = {
                        hpt: R === 0 ? 25 : 20, // Header row taller
                        customHeight: true
                    };
                }

                // Freeze the first row for better navigation
                ws['!freeze'] = { r: 1, c: 0 };

                // Add filters to header row for better data analysis
                ws['!autofilter'] = { ref: `A1:${XLSX.utils.encode_col(range.e.c)}1` };

                // Add data validation for better user experience
                if (range.e.r > 1) {
                    // Add conditional formatting for better visual appeal
                    ws['!conditionalFormatting'] = [
                        {
                            ref: `A2:${XLSX.utils.encode_col(range.e.c)}${range.e.r}`,
                            cfRules: [
                                {
                                    type: "expression",
                                    formulae: ["MOD(ROW(),2)=0"],
                                    style: { fill: { fgColor: { rgb: "F8F9FA" } } }
                                }
                            ]
                        }
                    ];
                }

                return ws;
            };

            if (Array.isArray(fetchedData)) {
                const cleanData = processDataForExport(fetchedData);
                if (cleanData.length > 0) {
                    const ws = createStyledWorksheet(cleanData, "البيانات");
                    XLSX.utils.book_append_sheet(wb, ws, "البيانات");
                } else {
                    const ws = createStyledWorksheet([{ message: "لا توجد بيانات للتصدير" }], "البيانات");
                    XLSX.utils.book_append_sheet(wb, ws, "البيانات");
                }
            } else if (typeof fetchedData === 'object' && fetchedData !== null) {
                let hasData = false;

                for (const [key, value] of Object.entries(fetchedData)) {
                    const sheetName = sanitizeSheetName(key);

                    if (Array.isArray(value) && value.length > 0) {
                        const cleanData = processDataForExport(value);
                        if (cleanData.length > 0) {
                            const ws = createStyledWorksheet(cleanData, sheetName);
                            XLSX.utils.book_append_sheet(wb, ws, sheetName);
                            hasData = true;
                        }
                    } else if (typeof value === 'object' && value !== null) {
                        const cleanData = processDataForExport([value]);
                        if (cleanData.length > 0) {
                            const ws = createStyledWorksheet(cleanData, sheetName);
                            XLSX.utils.book_append_sheet(wb, ws, sheetName);
                            hasData = true;
                        }
                    }
                }

                if (!hasData) {
                    const ws = createStyledWorksheet([{ message: "لا توجد بيانات للتصدير" }], "البيانات");
                    XLSX.utils.book_append_sheet(wb, ws, "البيانات");
                }
            } else {
                const ws = createStyledWorksheet([{ value: formatValue(fetchedData) }], "البيانات");
                XLSX.utils.book_append_sheet(wb, ws, "البيانات");
            }

            XLSX.writeFile(wb, `${fileName}.xlsx`);
            setExportError(null);
        } catch (error) {
            console.error('Excel export error:', error);
            setExportError('Error exporting to Excel');
        }
    }, [fetchedData, processDataForExport, fileName]);

    // Enhanced CSV export
    const exportCSV = useCallback(() => {
        try {
            if (!fetchedData) {
                throw new Error('No data available for export');
            }

            let csvContent = '';

            if (Array.isArray(fetchedData)) {
                const cleanData = processDataForExport(fetchedData);
                if (cleanData.length > 0) {
                    csvContent = convertToCSV(cleanData);
                } else {
                    csvContent = 'message\nلا توجد بيانات للتصدير';
                }
            } else if (typeof fetchedData === 'object' && fetchedData !== null) {
                for (const [key, value] of Object.entries(fetchedData)) {
                    csvContent += `\n=== ${key} ===\n\n`;

                    if (Array.isArray(value) && value.length > 0) {
                        const cleanData = processDataForExport(value);
                        if (cleanData.length > 0) {
                            csvContent += convertToCSV(cleanData);
                        }
                    } else if (typeof value === 'object' && value !== null) {
                        const cleanData = processDataForExport([value]);
                        if (cleanData.length > 0) {
                            csvContent += convertToCSV(cleanData);
                        }
                    } else if (!isValueEmpty(value)) {
                        csvContent += `${key}\n${formatValue(value)}\n`;
                    }

                    csvContent += '\n';
                }
            } else {
                csvContent = `value\n${formatValue(fetchedData)}`;
            }

            if (csvContent.trim()) {
                downloadFile(csvContent, `${fileName}.csv`, 'text/csv;charset=utf-8;');
                setExportError(null);
            } else {
                downloadFile('message\nلا توجد بيانات للتصدير', `${fileName}.csv`, 'text/csv;charset=utf-8;');
            }
        } catch (error) {
            console.error('CSV export error:', error);
            setExportError('Error exporting to CSV');
        }
    }, [fetchedData, processDataForExport, fileName]);

    // Enhanced JSON export
    const exportJSON = useCallback(() => {
        try {
            if (!fetchedData) {
                throw new Error('No data available for export');
            }

            const jsonContent = JSON.stringify(fetchedData, null, 2);
            downloadFile(jsonContent, `${fileName}.json`, 'application/json');
            setExportError(null);
        } catch (error) {
            console.error('JSON export error:', error);
            setExportError('Error exporting to JSON');
        }
    }, [fetchedData, fileName]);

    // Helper function to convert data to CSV format
    const convertToCSV = useCallback((data) => {
        if (!data || data.length === 0) return '';

        const headers = Object.keys(data[0]);
        let csvContent = headers.join(',') + '\n';

        data.forEach(row => {
            const values = headers.map(header => {
                const val = row[header];
                const formattedVal = formatValue(val);

                if (formattedVal.includes(',') || formattedVal.includes('"') || formattedVal.includes('\n')) {
                    return `"${formattedVal.replace(/"/g, '""')}"`;
                }
                return formattedVal;
            });
            csvContent += values.join(',') + '\n';
        });

        return csvContent;
    }, []);

    // Helper function to format dates and numbers for better Excel display
    const formatCellValue = useCallback((value) => {
        if (value === null || value === undefined) return '';

        // Check if it's a date
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
            return new Date(value);
        }

        // Check if it's a number
        if (typeof value === 'number') {
            return value;
        }

        // Check if it's a boolean
        if (typeof value === 'boolean') {
            return value ? 'نعم' : 'لا';
        }

        return value;
    }, []);

    // Helper function to download files
    const downloadFile = useCallback((content, filename, mimeType) => {
        const blob = new Blob([content], { type: mimeType });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();

        // Cleanup
        setTimeout(() => {
            URL.revokeObjectURL(link.href);
        }, 100);
    }, []);

    // Export handler
    const handleExport = useCallback((type) => {
        if (!fetchedData) {
            setExportError('No data available for export');
            return;
        }

        setExportError(null);

        switch (type) {
            case 'excel':
                exportExcel();
                break;
            case 'csv':
                exportCSV();
                break;
            case 'json':
                exportJSON();
                break;
            default:
                setExportError(`Unknown export type: ${type}`);
        }
    }, [fetchedData, exportExcel, exportCSV, exportJSON]);

    // Memoized disabled state
    const isDisabled = useMemo(() => {
        return isLoading || isError || !fetchedData || !!exportError;
    }, [isLoading, isError, fetchedData, exportError]);

    return (
        <React.Fragment>
            <SelectBtn
                icon={<PiExportBold />}
                title={'exportDataWord'}
                options={EXPORT_OPTIONS}
                handleClick={handleExport}
                disabled={isDisabled}
            />
            {exportError && (
                <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                    {exportError}
                </div>
            )}
        </React.Fragment>
    );
} 