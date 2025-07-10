// app/api/get-excel-data/route.js
import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

export async function GET(request) {
    console.log("Requisição GET recebida para /api/get-excel-data");
    try {
        const filePath = path.join(process.cwd(), 'data', 'Matriz GE - EP.xlsx');
        console.log(`Caminho do arquivo Excel construído: ${filePath}`);

        if (!fs.existsSync(filePath)) {
            console.error(`Arquivo Excel não encontrado em: ${filePath}`);
            return NextResponse.json({ error: 'Arquivo Excel não encontrado no caminho especificado.' }, { status: 404 });
        }
        console.log("Arquivo Excel encontrado. Lendo o arquivo para o buffer...");

        const fileBuffer = fs.readFileSync(filePath);
        console.log("Arquivo lido para o buffer. Processando o buffer com XLSX...");

        const workbook = XLSX.read(fileBuffer, { type: 'buffer', cellDates: true });
        console.log("Arquivo Excel lido do buffer. Nomes das abas:", workbook.SheetNames);

        const sheetName = 'Análise';
        const worksheet = workbook.Sheets[sheetName];

        if (!worksheet) {
            console.error(`Aba "${sheetName}" não encontrada no arquivo Excel.`);
            return NextResponse.json({ error: `Aba "${sheetName}" não encontrada no arquivo Excel` }, { status: 404 });
        }
        console.log(`Aba "${sheetName}" encontrada.`);

        // OPÇÃO: Usar a opção 'range' para pular as duas primeiras linhas.
        // A linha 3 do Excel (índice 2) se tornará a primeira linha na saída (índice 0).
        const jsonDataRaw = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,          // Gera um array de arrays
            range: 2,           // PULA as primeiras 2 linhas da planilha (linhas 1 e 2 do Excel).
                                // A leitura efetiva começa da linha 3 do Excel.
            blankrows: false,   // Não incluir linhas em branco (após o range aplicado)
            raw: false          // Obter valores formatados
        });
        
        console.log(`Conversão para JSON concluída (após pular 2 linhas). Número de linhas em jsonDataRaw: ${jsonDataRaw.length}`);

        // Logs para depuração da estrutura de jsonDataRaw após o 'range: 2'
        if (jsonDataRaw.length > 0) console.log("jsonDataRaw[0] (esperado: Cabeçalhos 'Modalidade', ...):", JSON.stringify(jsonDataRaw[0]));
        if (jsonDataRaw.length > 1) console.log("jsonDataRaw[1] (esperado: Primeira linha de dados):", JSON.stringify(jsonDataRaw[1]));


        if (!jsonDataRaw || jsonDataRaw.length === 0) {
            console.error('A planilha não contém dados após pular as 2 primeiras linhas e processar.');
            return NextResponse.json({ error: 'A planilha não contém dados suficientes após o processamento inicial.' }, { status: 400 });
        }

        // Com range: 2, jsonDataRaw[0] DEVE ser a linha de cabeçalho correta (originalmente linha 3 do Excel)
        const headerRow = jsonDataRaw[0];
        
        // E os dados DEVERÃO começar de jsonDataRaw[1] (originalmente linha 4 do Excel)
        const dataRows = jsonDataRaw.slice(1);

        console.log("Linha de cabeçalho utilizada (jsonDataRaw[0] após range:2):", headerRow);
        console.log(`Número de linhas de dados (jsonDataRaw.slice(1) após range:2): ${dataRows.length}`);

        if (!headerRow || headerRow.length === 0) {
            console.error('Linha de cabeçalho está vazia ou ausente após o processamento.');
            return NextResponse.json({ error: 'Falha ao determinar a linha de cabeçalho.' }, { status: 400 });
        }
        if (dataRows.length > 0) {
            console.log("Primeira linha de dados REAL (para mapeamento):", dataRows[0]);
        } else {
            console.log("Nenhuma linha de dados encontrada para mapear.");
            return NextResponse.json([]); // Retorna array vazio se não houver dados
        }

        const jsonData = dataRows.map((rowArray, rowIndex) => {
            let obj = {};
            if (!Array.isArray(rowArray) || rowArray.length === 0) {
                console.warn(`Linha de dados ${rowIndex} (índice ${rowIndex} em dataRows) não é um array válido ou está vazia:`, rowArray);
                return null; 
            }
            headerRow.forEach((header, headerIndex) => {
                const headerStr = String(header || '').trim(); 
                if (headerStr.toLowerCase() !== 'ignorar' && headerStr !== '') { // Remove "Ignorar" se estiver no header
                    obj[headerStr] = headerIndex < rowArray.length ? rowArray[headerIndex] : undefined;
                }
            });
            if (rowIndex === 0) { // Log do primeiro objeto após o mapeamento
                console.log("Primeiro objeto mapeado:", obj);
            }
            return obj;
        }).filter(item => item !== null && Object.keys(item).length > 0); 
        
        const filteredData = jsonData.filter(item => {
            // CORREÇÃO: Usar a chave "PRODUTO" (maiúsculas) como está no headerRow e nos objetos mapeados.
            const produtoValue = item && item.PRODUTO; 
            return produtoValue != null && produtoValue !== undefined && String(produtoValue).trim() !== "";
        });

        console.log(`Número de itens após filtragem por 'PRODUTO': ${filteredData.length}`); // Log ajustado
        if (filteredData.length > 0) {
            console.log("Primeiro item após filtragem de PRODUTO:", filteredData[0]); // Log ajustado
        }

        console.log("Processamento concluído. Retornando dados filtrados.");
        return NextResponse.json(filteredData);

    } catch (error) {
        console.error('!!! Erro crítico ao processar o arquivo Excel:', error);
        console.error('Stack trace do erro:', error.stack);
        return NextResponse.json({ 
            error: 'Falha ao processar o arquivo Excel', 
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
        }, { status: 500 });
    }
}
