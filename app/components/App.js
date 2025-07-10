"use client";

import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy } from 'react';
import Head from 'next/head';
import {
  MantineProvider,
  Container,
  Title,
  Button,
  Checkbox,
  Popover,
  Stack,
  Grid,
  Text,
  Group,
  Loader,
  Alert,
  Paper,
  Switch,
  Box,
  useMantineColorScheme,
  useMantineTheme,
} from '@mantine/core';
import {
  IconDownload,
  IconChevronDown,
  IconAlertCircle,
  IconX,
  IconSun,
  IconMoon,
  IconChartBubble,
  IconFileText,
} from '@tabler/icons-react';

// --- Global Constants ---
const IMAGE_ORIGINAL_WIDTH = 1705;
const IMAGE_ORIGINAL_HEIGHT = 1650;
const TARGET_ASPECT_RATIO = IMAGE_ORIGINAL_WIDTH / IMAGE_ORIGINAL_HEIGHT;
const SIDEBAR_WIDTH = '60px';
const DARK_MODE_FONT_COLOR = '#cfd1d3';

// --- Data Access Keys ---
const KEY_GRANDE_AREA = 'GRANDE ÁREA';
const KEY_QUADRANTES = 'QUADRANTES';
const KEY_PRODUTO = 'PRODUTO';
const KEY_POSICAO_COMPETITIVA = 'Posição Competitiva';
const KEY_ATRATIVIDADE_MERCADO = 'Atratividade Mercado';
const KEY_HORA_ALUNO = 'HORA ALUNO';

// --- Technical Note Content ---
const textoDaNota = `
<h1 style="margin-bottom: 24px;">Nota Técnica - Matriz GE</h1>

<p>A <strong>Matriz GE</strong> é uma ferramenta de <strong>análise estratégica</strong> desenvolvida pela General Electric em parceria com a McKinsey & Company. Também conhecida como <strong>Matriz McKinsey</strong> ou <strong>Matriz de Portfólio Multifatorial</strong>, ela é utilizada para avaliar o posicionamento estratégico de diferentes unidades de negócio ou produtos em um portfólio.</p>

<h2 style="margin: 24px 0 16px;">Estrutura da Matriz</h2>

<p>A matriz é composta por <strong>dois eixos principais</strong>:</p>

<ul style="margin: 16px 0; padding-left: 24px;">
  <li><strong>Eixo Y (Atratividade do Mercado):</strong> Avalia fatores externos e oportunidades do mercado</li>
  <li><strong>Eixo X (Posição Competitiva):</strong> Analisa a força competitiva da empresa no mercado</li>
</ul>

<h2 style="margin: 24px 0 16px;">Quadrantes da Matriz</h2>

<p>A matriz é dividida em <strong>nove quadrantes</strong>, formando três zonas estratégicas:</p>

<ul style="margin: 16px 0; padding-left: 24px;">
  <li><strong>Zona Verde (Investir/Crescer):</strong> Alta atratividade e forte posição competitiva</li>
  <li><strong>Zona Amarela (Seletividade):</strong> Posição intermediária, requer análise cuidadosa</li>
  <li><strong>Zona Vermelha (Colher/Desinvestir):</strong> Baixa atratividade e fraca posição competitiva</li>
</ul>

<h2 style="margin: 24px 0 16px;">Interpretação dos Resultados</h2>

<p>Para cada produto ou unidade de negócio, a matriz sugere diferentes estratégias:</p>

<ul style="margin: 16px 0; padding-left: 24px;">
  <li><strong>Investir/Crescer:</strong> Alocar recursos significativos para crescimento</li>
  <li><strong>Seletividade:</strong> Investir seletivamente e gerenciar para obter receitas</li>
  <li><strong>Colher/Desinvestir:</strong> Minimizar investimentos ou considerar desinvestimento</li>
</ul>

<h2 style="margin: 24px 0 16px;">Aplicação na Educação Profissional</h2>

<p>Na análise da Educação Profissional, a matriz é adaptada para considerar:</p>

<ul style="margin: 16px 0; padding-left: 24px;">
  <li>Demanda do mercado por profissionais</li>
  <li>Capacidade de oferta dos cursos</li>
  <li>Infraestrutura necessária</li>
  <li>Retorno sobre investimento</li>
  <li>Alinhamento com necessidades da indústria</li>
</ul>

<p style="margin-top: 24px;">Esta ferramenta auxilia na <strong>tomada de decisão estratégica</strong> sobre o portfólio de cursos, permitindo uma alocação mais eficiente de recursos e um melhor alinhamento com as demandas do mercado.</p>
`;

// --- Plotly Chart Fallback Component ---
const PlotlyLoadingFallback = () => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        fontFamily: 'Josefin Sans, Arial, sans-serif',
        color: 'black',
      }}
    >
      Carregando gráfico...
    </div>
  );
};

// --- Dynamic Import for Plotly ---
const Plot = lazy(() => import('react-plotly.js'));

// --- FilterPopover Component ---
function FilterPopover({ labelText, options, selectedValues, onChange, buttonId, opened, onOpenChange }) {
  const [searchValue, setSearchValue] = useState('');
  const filteredOptions = useMemo(() => {
    if (!searchValue) return options;
    const searchLower = searchValue.toLowerCase();
    return options.filter(option => 
      String(option).toLowerCase().includes(searchLower)
    );
  }, [options, searchValue]);

  const handleSelectAll = useCallback(() => {
    onChange(options);
  }, [onChange, options]);

  const handleDeselectAll = useCallback(() => {
    onChange([]);
  }, [onChange]);

  const handleToggleOption = useCallback((option) => {
    onChange(prev => {
      const isSelected = prev.includes(option);
      if (isSelected) {
        return prev.filter(item => item !== option);
      } else {
        return [...prev, option];
      }
    });
  }, [onChange]);

  return (
    <Popover
      opened={opened}
      onChange={onOpenChange}
      position="bottom"
      shadow="md"
      width={300}
    >
      <Popover.Target>
        <Button
          id={buttonId}
          variant="light"
          rightIcon={<IconChevronDown size={16} />}
          size="sm"
          color={selectedValues.length > 0 ? 'blue' : 'gray'}
        >
          {labelText} {selectedValues.length > 0 && `(${selectedValues.length})`}
        </Button>
      </Popover.Target>

      <Popover.Dropdown>
        <Stack spacing="xs">
          <Group position="apart">
            <Text size="sm" weight={500}>{labelText}</Text>
            <Group spacing={4}>
              <Button
                variant="subtle"
                size="xs"
                compact
                onClick={handleSelectAll}
              >
                Selecionar todos
              </Button>
              <Button
                variant="subtle"
                size="xs"
                compact
                onClick={handleDeselectAll}
              >
                Limpar
              </Button>
            </Group>
          </Group>

          <input
            type="text"
            placeholder="Buscar..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />

          <div style={{ 
            maxHeight: '300px', 
            overflowY: 'auto',
            marginRight: '-8px',
            paddingRight: '8px'
          }}>
            {filteredOptions.map((option) => (
              <Checkbox
                key={option}
                label={option}
                checked={selectedValues.includes(option)}
                onChange={() => handleToggleOption(option)}
                styles={{
                  root: { marginTop: 4 },
                  label: { fontSize: '14px' }
                }}
              />
            ))}
            {filteredOptions.length === 0 && (
              <Text size="sm" color="dimmed" align="center" mt="md">
                Nenhum resultado encontrado
              </Text>
            )}
          </div>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}

// --- AppSidebar Component ---
function AppSidebar({ colorScheme, currentPage, onNavChange }) {
  return (
    <div style={{
      width: SIDEBAR_WIDTH,
      height: '100vh',
      backgroundColor: colorScheme === 'dark' ? '#1A1B1E' : 'white',
      borderRight: `1px solid ${colorScheme === 'dark' ? '#2C2E33' : '#E9ECEF'}`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '8px 0',
      gap: '8px'
    }}>
      <button
        onClick={() => onNavChange('matriz')}
        title="Matriz GE"
        style={{
          width: '44px',
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          backgroundColor: currentPage === 'matriz' 
            ? (colorScheme === 'dark' ? '#25262B' : '#F1F3F5')
            : 'transparent',
          color: currentPage === 'matriz'
            ? (colorScheme === 'dark' ? '#FFFFFF' : '#000000')
            : (colorScheme === 'dark' ? '#909296' : '#868E96'),
          transition: 'all 0.2s ease'
        }}
      >
        <span className="material-icons-round" style={{ fontSize: '24px' }}>
          view_quilt
        </span>
      </button>

      <button
        onClick={() => onNavChange('nota')}
        title="Nota Técnica"
        style={{
          width: '44px',
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          backgroundColor: currentPage === 'nota'
            ? (colorScheme === 'dark' ? '#25262B' : '#F1F3F5')
            : 'transparent',
          color: currentPage === 'nota'
            ? (colorScheme === 'dark' ? '#FFFFFF' : '#000000')
            : (colorScheme === 'dark' ? '#909296' : '#868E96'),
          transition: 'all 0.2s ease'
        }}
      >
        <span className="material-icons-round" style={{ fontSize: '24px' }}>
          description
        </span>
      </button>
    </div>
  );
}

// --- NotaTecnicaPage Component ---
function NotaTecnicaPage({ colorScheme }) {
  return (
    <div style={{
      padding: '20px',
      maxWidth: '800px',
      margin: '0 auto',
      color: colorScheme === 'dark' ? DARK_MODE_FONT_COLOR : 'inherit'
    }}>
      <Paper
        p="xl"
        radius="md"
        style={{
          backgroundColor: colorScheme === 'dark' ? '#1A1B1E' : 'white',
        }}
      >
        <div dangerouslySetInnerHTML={{ __html: textoDaNota }} />
      </Paper>
    </div>
  );
}

// --- ExplanationContent Component ---
function ExplanationContent({ colorScheme }) {
  // ... (todo o conteúdo do componente ExplanationContent)
}

// --- GE Matrix Content Component ---
function MatrizGEPageContent({
  loadingData,
  originalData,
  errorMessage,
  selectedAreas,
  setSelectedAreas,
  selectedQuadrantes,
  setSelectedQuadrantes,
  selectedProdutos,
  setSelectedProdutos,
  areaOptions,
  quadranteOptions,
  produtoOptions,
  exibirTexto,
  setExibirTexto,
  plotFigure,
  setPlotFigure,
  plotRevision,
  setPlotRevision,
  getUniqueSortedOptions,
  colorScheme,
  onResetFilters,
  onDownloadRequest,
  openedPopover,
  setOpenedPopover,
}) {
  return (
    <div style={{ 
      padding: '20px', 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      gap: '20px',
      backgroundColor: colorScheme === 'dark' ? '#141a28' : '#fafafa',
      color: colorScheme === 'dark' ? DARK_MODE_FONT_COLOR : 'inherit'
    }}>
      {/* Área de Filtros */}
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <FilterPopover
          labelText="Grande Área"
          options={areaOptions}
          selectedValues={selectedAreas}
          onChange={setSelectedAreas}
          buttonId="area-filter"
          opened={openedPopover === 'area'}
          onOpenChange={(isOpen) => setOpenedPopover(isOpen ? 'area' : null)}
        />

        <FilterPopover
          labelText="Quadrantes"
          options={quadranteOptions}
          selectedValues={selectedQuadrantes}
          onChange={setSelectedQuadrantes}
          buttonId="quadrante-filter"
          opened={openedPopover === 'quadrante'}
          onOpenChange={(isOpen) => setOpenedPopover(isOpen ? 'quadrante' : null)}
        />

        <FilterPopover
          labelText="Produtos"
          options={produtoOptions}
          selectedValues={selectedProdutos}
          onChange={setSelectedProdutos}
          buttonId="produto-filter"
          opened={openedPopover === 'produto'}
          onOpenChange={(isOpen) => setOpenedPopover(isOpen ? 'produto' : null)}
        />

        <Button
          variant="light"
          color="gray"
          onClick={onResetFilters}
          leftIcon={<IconX size={16} />}
          size="sm"
        >
          Limpar Filtros
        </Button>
      </div>

      {/* Área do Gráfico */}
      <div style={{ 
        flexGrow: 1, 
        position: 'relative',
        minHeight: 0,
        backgroundColor: colorScheme === 'dark' ? '#1A1B1E' : 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        {loadingData ? (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: colorScheme === 'dark' ? 'rgba(26,27,30,0.8)' : 'rgba(255,255,255,0.8)',
          }}>
            <Loader size="lg" />
          </div>
        ) : errorMessage ? (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Erro"
            color="red"
            variant="filled"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              maxWidth: '80%'
            }}
          >
            {errorMessage}
          </Alert>
        ) : (
          <Suspense fallback={<PlotlyLoadingFallback />}>
            <Plot
              data={plotFigure.data || []}
              layout={plotFigure.layout || {}}
              revision={plotRevision}
              useResizeHandler
              style={{ width: '100%', height: '100%' }}
              config={{
                displayModeBar: true,
                displaylogo: false,
                modeBarButtonsToRemove: [
                  'zoom2d',
                  'pan2d',
                  'select2d',
                  'lasso2d',
                  'zoomIn2d',
                  'zoomOut2d',
                  'autoScale2d',
                  'resetScale2d',
                  'hoverClosestCartesian',
                  'hoverCompareCartesian',
                  'toggleSpikelines'
                ]
              }}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
}

// --- Main App Component ---
export default function App() {
  const [currentPage, setCurrentPage] = useState('matriz');
  const [effectiveColorScheme, setEffectiveColorScheme] = useState('light');
  const [isClient, setIsClient] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [downloadPulse, setDownloadPulse] = useState(false);

  const [loadingData, setLoadingData] = useState(true);
  const [originalData, setOriginalData] = useState([]);
  const [selectedAreas, setSelectedAreas] = useState([]);
  const [selectedQuadrantes, setSelectedQuadrantes] = useState([]);
  const [selectedProdutos, setSelectedProdutos] = useState([]);
  const [exibirTexto, setExibirTexto] = useState(true);
  const [plotFigure, setPlotFigure] = useState({ data: [], layout: {} });
  const [plotRevision, setPlotRevision] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [openedPopover, setOpenedPopover] = useState(null);

  // Função para obter opções únicas e ordenadas
  const getUniqueSortedOptions = useCallback((data, key) => {
    if (!data || !Array.isArray(data)) return [];
    return [...new Set(data.map(item => item[key]))].sort();
  }, []);

  // Opções para os filtros
  const areaOptions = useMemo(() => getUniqueSortedOptions(originalData, KEY_GRANDE_AREA), [originalData, getUniqueSortedOptions]);
  const quadranteOptions = useMemo(() => getUniqueSortedOptions(originalData, KEY_QUADRANTES), [originalData, getUniqueSortedOptions]);
  const produtoOptions = useMemo(() => getUniqueSortedOptions(originalData, KEY_PRODUTO), [originalData, getUniqueSortedOptions]);

  // Função para carregar os dados do Excel
  const loadExcelData = useCallback(async () => {
    try {
      setLoadingData(true);
      setErrorMessage('');
      
      const response = await fetch('/api/get-excel-data');
      if (!response.ok) {
        throw new Error('Falha ao carregar os dados');
      }
      
      const data = await response.json();
      setOriginalData(data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setErrorMessage('Erro ao carregar os dados. Por favor, tente novamente.');
    } finally {
      setLoadingData(false);
    }
  }, []);

  // Efeito para carregar os dados quando o componente montar
  useEffect(() => {
    loadExcelData();
  }, [loadExcelData]);

  // Efeito para detectar o cliente
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Função para alternar o tema
  const toggleColorScheme = useCallback(() => {
    setEffectiveColorScheme(current => {
      const newScheme = current === 'dark' ? 'light' : 'dark';
      setRotation(prev => prev + 180);
      return newScheme;
    });
  }, []);

  // Função para resetar os filtros
  const handleResetFilters = useCallback(() => {
    setSelectedAreas([]);
    setSelectedQuadrantes([]);
    setSelectedProdutos([]);
  }, []);

  // Função para baixar o gráfico
  const handleDownloadRequest = useCallback(() => {
    if (!window || !window.Plotly) {
      console.error('Plotly não está disponível');
      return;
    }

    const graphDiv = document.querySelector('.js-plotly-plot');
    if (!graphDiv) {
      console.error('Elemento do gráfico não encontrado');
      return;
    }

    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().split('T')[0];
    const filename = `matriz-ge-${formattedDate}.png`;

    window.Plotly.downloadImage(graphDiv, {
      format: 'png',
      width: 1200,
      height: 800,
      filename: filename,
      scale: 2
    });
  }, []);

  // Função para atualizar o gráfico
  const updatePlot = useCallback(() => {
    if (!originalData || originalData.length === 0) return;

    // Filtra os dados baseado nas seleções
    const filteredData = originalData.filter(item => {
      const areaMatch = selectedAreas.length === 0 || selectedAreas.includes(item[KEY_GRANDE_AREA]);
      const quadranteMatch = selectedQuadrantes.length === 0 || selectedQuadrantes.includes(item[KEY_QUADRANTES]);
      const produtoMatch = selectedProdutos.length === 0 || selectedProdutos.includes(item[KEY_PRODUTO]);
      return areaMatch && quadranteMatch && produtoMatch;
    });

    // Prepara os dados para o Plotly
    const trace = {
      x: filteredData.map(item => parseFloat(item[KEY_POSICAO_COMPETITIVA])),
      y: filteredData.map(item => parseFloat(item[KEY_ATRATIVIDADE_MERCADO])),
      mode: 'markers+text',
      type: 'scatter',
      text: filteredData.map(item => item[KEY_PRODUTO]),
      textposition: 'top center',
      marker: {
        size: filteredData.map(item => Math.sqrt(parseFloat(item[KEY_HORA_ALUNO] || 0)) * 2),
        color: filteredData.map(item => {
          const x = parseFloat(item[KEY_POSICAO_COMPETITIVA]);
          const y = parseFloat(item[KEY_ATRATIVIDADE_MERCADO]);
          
          // Define as cores baseado nos quadrantes
          if (x >= 3.33 && y >= 3.33) return '#4CAF50';      // Verde
          if (x <= 1.67 && y <= 1.67) return '#F44336';      // Vermelho
          if ((x > 1.67 && x < 3.33) || (y > 1.67 && y < 3.33)) return '#FFC107';  // Amarelo
          if (x >= 3.33 || y >= 3.33) return '#4CAF50';      // Verde
          return '#F44336';                                   // Vermelho
        }),
        opacity: 0.7
      },
      textfont: {
        family: 'Roboto Flex, Arial, sans-serif',
        size: 12,
        color: effectiveColorScheme === 'dark' ? DARK_MODE_FONT_COLOR : '#000000'
      },
      hovertemplate:
        '<b>%{text}</b><br>' +
        'Posição Competitiva: %{x:.1f}<br>' +
        'Atratividade Mercado: %{y:.1f}<br>' +
        '<extra></extra>'
    };

    // Configuração do layout
    const layout = {
      showlegend: false,
      xaxis: {
        title: 'Posição Competitiva',
        range: [0, 5],
        gridcolor: effectiveColorScheme === 'dark' ? '#2C2E33' : '#E9ECEF',
        zerolinecolor: effectiveColorScheme === 'dark' ? '#2C2E33' : '#E9ECEF',
        tickfont: {
          family: 'Roboto Flex, Arial, sans-serif',
          color: effectiveColorScheme === 'dark' ? DARK_MODE_FONT_COLOR : '#000000'
        }
      },
      yaxis: {
        title: 'Atratividade do Mercado',
        range: [0, 5],
        gridcolor: effectiveColorScheme === 'dark' ? '#2C2E33' : '#E9ECEF',
        zerolinecolor: effectiveColorScheme === 'dark' ? '#2C2E33' : '#E9ECEF',
        tickfont: {
          family: 'Roboto Flex, Arial, sans-serif',
          color: effectiveColorScheme === 'dark' ? DARK_MODE_FONT_COLOR : '#000000'
        }
      },
      plot_bgcolor: effectiveColorScheme === 'dark' ? '#1A1B1E' : 'white',
      paper_bgcolor: effectiveColorScheme === 'dark' ? '#1A1B1E' : 'white',
      font: {
        family: 'Roboto Flex, Arial, sans-serif',
        color: effectiveColorScheme === 'dark' ? DARK_MODE_FONT_COLOR : '#000000'
      },
      shapes: [
        // Linhas verticais
        {
          type: 'line',
          x0: 1.67,
          x1: 1.67,
          y0: 0,
          y1: 5,
          line: {
            color: effectiveColorScheme === 'dark' ? '#2C2E33' : '#E9ECEF',
            width: 1,
            dash: 'dash'
          }
        },
        {
          type: 'line',
          x0: 3.33,
          x1: 3.33,
          y0: 0,
          y1: 5,
          line: {
            color: effectiveColorScheme === 'dark' ? '#2C2E33' : '#E9ECEF',
            width: 1,
            dash: 'dash'
          }
        },
        // Linhas horizontais
        {
          type: 'line',
          x0: 0,
          x1: 5,
          y0: 1.67,
          y1: 1.67,
          line: {
            color: effectiveColorScheme === 'dark' ? '#2C2E33' : '#E9ECEF',
            width: 1,
            dash: 'dash'
          }
        },
        {
          type: 'line',
          x0: 0,
          x1: 5,
          y0: 3.33,
          y1: 3.33,
          line: {
            color: effectiveColorScheme === 'dark' ? '#2C2E33' : '#E9ECEF',
            width: 1,
            dash: 'dash'
          }
        }
      ],
      annotations: [
        // Quadrantes
        {
          x: 0.83,
          y: 0.83,
          text: 'Desinvestir',
          showarrow: false,
          font: {
            size: 14,
            color: effectiveColorScheme === 'dark' ? '#F44336' : '#D32F2F'
          }
        },
        {
          x: 2.5,
          y: 2.5,
          text: 'Seletividade',
          showarrow: false,
          font: {
            size: 14,
            color: effectiveColorScheme === 'dark' ? '#FFC107' : '#F57C00'
          }
        },
        {
          x: 4.17,
          y: 4.17,
          text: 'Investir',
          showarrow: false,
          font: {
            size: 14,
            color: effectiveColorScheme === 'dark' ? '#4CAF50' : '#388E3C'
          }
        }
      ],
      margin: { t: 20, r: 20, b: 50, l: 50 }
    };

    setPlotFigure({ data: [trace], layout });
    setPlotRevision(prev => prev + 1);
  }, [originalData, selectedAreas, selectedQuadrantes, selectedProdutos, effectiveColorScheme, exibirTexto]);

  // Efeito para atualizar o gráfico quando os filtros ou dados mudarem
  useEffect(() => {
    updatePlot();
  }, [updatePlot]);

  return (
    <>
      <Head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons+Round" />
      </Head>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          minHeight: '100vh',
          width: '100vw',
          overflow: 'hidden',
          backgroundColor: effectiveColorScheme === 'dark' ? '#141a28' : '#fafafa',
          fontFamily: 'Roboto Flex, Arial, sans-serif',
        }}
      >
        <AppSidebar
          colorScheme={effectiveColorScheme}
          currentPage={currentPage}
          onNavChange={setCurrentPage}
        />
        <div
          style={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            overflowX: 'hidden',
            height: '100vh',
            minHeight: 0,
            overflowY: 'hidden',
            backgroundColor: effectiveColorScheme === 'dark' ? '#141a28' : '#fafafa',
            position: 'relative',
          }}
        >
          {isClient && (
            <div style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 10, display: 'flex', alignItems: 'center', gap: 2 }}>
              {currentPage === 'matriz' && (
                <>
                  <button
                    onClick={() => setExibirTexto((v) => !v)}
                    title={exibirTexto ? 'Ocultar nomes' : 'Exibir nomes'}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: 8,
                      borderRadius: '50%',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background 0.2s',
                    }}
                  >
                    <span
                      className="material-icons-round"
                      style={{
                        fontSize: 26,
                        color: effectiveColorScheme === 'dark' ? '#cfd1d3' : '#000000',
                        transition: 'transform 0.4s cubic-bezier(.4,0,.2,1)',
                        transform: exibirTexto ? 'rotate(0deg)' : 'rotate(180deg)',
                        display: 'flex',
                        alignItems: 'center',
                        verticalAlign: 'middle',
                      }}
                    >
                      {exibirTexto ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setDownloadPulse(true);
                      handleDownloadRequest();
                      setTimeout(() => setDownloadPulse(false), 300);
                    }}
                    title="Baixar gráfico"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: 8,
                      borderRadius: '50%',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background 0.2s',
                    }}
                  >
                    <span
                      className="material-icons-round"
                      style={{
                        fontSize: 26,
                        color: effectiveColorScheme === 'dark' ? '#cfd1d3' : '#000000',
                        transition: 'transform 0.3s cubic-bezier(.4,0,.2,1)',
                        transform: downloadPulse ? 'scale(1.35)' : 'scale(1)',
                        display: 'flex',
                        alignItems: 'center',
                        verticalAlign: 'middle',
                      }}
                    >
                      download
                    </span>
                  </button>
                </>
              )}
              <button
                onClick={toggleColorScheme}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  backgroundColor: 'transparent',
                  border: 'none',
                  padding: '8px',
                  borderRadius: '50%',
                  transition: 'background-color 0.2s ease',
                }}
              >
                <span
                  className="material-icons-round"
                  style={{
                    fontSize: 28,
                    color: effectiveColorScheme === 'dark' ? '#cfd1d3' : '#000000',
                    transform: `rotate(${rotation}deg)`,
                    transition: 'transform 0.5s ease',
                    display: 'flex',
                    alignItems: 'center',
                    verticalAlign: 'middle',
                  }}
                >
                  {effectiveColorScheme === 'dark' ? 'dark_mode' : 'light_mode'}
                </span>
              </button>
            </div>
          )}

          <div
            style={{
              flexGrow: 1,
              minHeight: 0,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              paddingTop: isClient ? 'calc(8px + 36px + 8px)' : 0,
            }}
          >
            {currentPage === 'matriz' && (
              <MatrizGEPageContent
                loadingData={loadingData}
                originalData={originalData}
                errorMessage={errorMessage}
                selectedAreas={selectedAreas}
                setSelectedAreas={setSelectedAreas}
                selectedQuadrantes={selectedQuadrantes}
                setSelectedQuadrantes={setSelectedQuadrantes}
                selectedProdutos={selectedProdutos}
                setSelectedProdutos={setSelectedProdutos}
                areaOptions={areaOptions}
                quadranteOptions={quadranteOptions}
                produtoOptions={produtoOptions}
                exibirTexto={exibirTexto}
                setExibirTexto={setExibirTexto}
                plotFigure={plotFigure}
                setPlotFigure={setPlotFigure}
                plotRevision={plotRevision}
                setPlotRevision={setPlotRevision}
                getUniqueSortedOptions={getUniqueSortedOptions}
                colorScheme={effectiveColorScheme}
                onResetFilters={handleResetFilters}
                onDownloadRequest={handleDownloadRequest}
                openedPopover={openedPopover}
                setOpenedPopover={setOpenedPopover}
              />
            )}
            {currentPage === 'nota' && <NotaTecnicaPage colorScheme={effectiveColorScheme} />}
          </div>
        </div>
      </div>
    </>
  );
} 