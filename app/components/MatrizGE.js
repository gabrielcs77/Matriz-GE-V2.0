"use client";

import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

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

function getQuadranteValue(item) {
  return item['QUADRANTE'] ?? item['QUADRANTES'] ?? item['quadrante'] ?? '';
}

// Função utilitária para normalizar strings (remove acentos, espaços extras e deixa minúsculo)
  function normalizeString(str) {
    return String(str || '')
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

// --- Global Constants ---
const IMAGE_ORIGINAL_WIDTH = 1705;
const IMAGE_ORIGINAL_HEIGHT = 1650;
const TARGET_ASPECT_RATIO = IMAGE_ORIGINAL_WIDTH / IMAGE_ORIGINAL_HEIGHT;
const SIDEBAR_WIDTH = '60px';
const DARK_MODE_FONT_COLOR = '#cfd1d3';

// --- Data Access Keys ---
const KEY_GRANDE_AREA = 'GRANDE ÁREA';
const KEY_MODALIDADE = 'MODALIDADE'; // NOVO: chave para modalidade
const KEY_QUADRANTES = 'QUADRANTES';
const KEY_PRODUTO = 'PRODUTO';
const KEY_POSICAO_COMPETITIVA = 'Posição Competitiva';
const KEY_ATRATIVIDADE_MERCADO = 'Atratividade Mercado';
const KEY_HORA_ALUNO = 'HORA ALUNO';

// --- Critérios e suas notas ---
const CRITERIOS_CONFIG = {
  'Faturamento': {
    notas: [
      { valor: 1, descricao: 'valor igual ou inferior a R$ 100.000,00 (Habilitação Técnica) | igual ou inferior a R$ 75.000,00 (Qualificação Profissional)' },
      { valor: 2, descricao: 'valor entre R$ 100.000,01 e R$ 250.000,00 (Habilitação Técnica) | entre R$ 75.000,01 e R$ 200.000,00 (Qualificação Profissional)' },
      { valor: 3, descricao: 'valor entre R$ 250.000,01 e R$ 300.000,00 (Habilitação Técnica) | entre R$ 200.000,01 e R$ 400.000,00 (Qualificação Profissional)' },
      { valor: 4, descricao: 'valor entre R$ 300.000,01 e R$ 600.000,00 (Habilitação Técnica) | entre R$ 400.000,01 e R$ 800.000,00 (Qualificação Profissional)' },
      { valor: 5, descricao: 'valor acima de R$ 600.000,00 (Habilitação Técnica) | acima de R$ 800.000,00 (Qualificação Profissional)' }
    ]
  },
  'Satisfação': {
    notas: [
      { valor: 1, descricao: 'NPS até 20%' },
      { valor: 2, descricao: 'NPS entre 21% e 40%' },
      { valor: 3, descricao: 'NPS entre 41% e 60%' },
      { valor: 4, descricao: 'NPS entre 61% e 80%' },
      { valor: 5, descricao: 'NPS acima de 80%' }
    ]
  },
  'Capacidade de Oferta': {
    notas: [
      { valor: 1, descricao: 'menor ou igual que 50%' },
      { valor: 2, descricao: 'maior que 50% e menor ou igual que 70%' },
      { valor: 3, descricao: 'maior que 70% e menor ou igual que 80%' },
      { valor: 4, descricao: 'maior que 80% e menor ou igual que 90%' },
      { valor: 5, descricao: 'maior que 90%' }
    ]
  },
  'Facilidade de Adesão': {
    notas: [
      { valor: 1, descricao: 'maior que 120 dias' },
      { valor: 2, descricao: 'maior que 100 dias e menor ou igual que 120 dias' },
      { valor: 3, descricao: 'maior que 80 dias e menor ou igual que 100 dias' },
      { valor: 4, descricao: 'maior que 60 dias e menor ou igual que 80 dias' },
      { valor: 5, descricao: 'menor ou igual que 60 dias' }
    ]
  },
  'Tamanho de Mercado': {
    notas: [
      { valor: 1, descricao: 'saldo menor ou igual a 500 horas (Habilitação Técnica) | menor ou igual a 100 horas (Qualificação)' },
      { valor: 2, descricao: 'saldo entre 501 e 1000 horas (Habilitação Técnica) | entre 101 e 500 horas (Qualificação)' },
      { valor: 3, descricao: 'saldo entre 1001 e 2000 horas (Habilitação Técnica) | entre 501 e 1200 horas (Qualificação)' },
      { valor: 4, descricao: 'saldo entre 2001 e 3000 horas (Habilitação Técnica) | entre 1201 e 2500 horas (Qualificação)' },
      { valor: 5, descricao: 'saldo acima de 3000 horas (Habilitação Técnica) | acima de 2500 horas (Qualificação)' }
    ]
  },
  'Crescimento de Mercado': {
    notas: [
      { valor: 1, descricao: 'resultado igual ou inferior a 20.000 (Habilitação Técnica) | igual ou inferior a 0 (Qualificação)' },
      { valor: 2, descricao: 'resultado entre 20.001 e 40.000 (Habilitação Técnica) | entre 1 e 1.000 (Qualificação)' },
      { valor: 3, descricao: 'resultado entre 40.001 e 60.000 (Habilitação Técnica) | entre 1.001 e 2.500 (Qualificação)' },
      { valor: 4, descricao: 'resultado entre 60.001 e 80.000 (Habilitação Técnica) | entre 2.501 e 4.500 (Qualificação Profissional)' },
      { valor: 5, descricao: 'resultado acima de 80.000 (Habilitação Técnica) | acima de 4.500 (Qualificação)' }
    ]
  },
  'Vulnerabilidade': {
    notas: [
      { valor: 1, descricao: 'cenário muito desfavorável' },
      { valor: 2, descricao: 'cenário desfavorável' },
      { valor: 3, descricao: 'cenário neutro' },
      { valor: 4, descricao: 'cenário favorável' },
      { valor: 5, descricao: 'cenário muito favorável' }
    ]
  },
  'Volume de Concorrentes': {
    notas: [
      { valor: 1, descricao: 'há 3 ou mais concorrentes relevantes' },
      { valor: 2, descricao: 'há concorrentes e 2 são relevantes' },
      { valor: 3, descricao: 'há concorrentes, mas somente 1 é relevante' },
      { valor: 4, descricao: 'há concorrentes, mas nenhum relevante' },
      { valor: 5, descricao: 'nenhum concorrente relevante' }
    ]
  }
};

// --- Mapeamento de critérios para colunas reais da planilha ---
const CRITERIOS_TO_COLUNAS = {
  'Faturamento': 'Faturamento',
  'Satisfação': 'satisfação dos clientes',
  'Capacidade de Oferta': 'Capacidade de Oferta',
  'Facilidade de Adesão': 'Facilidade de Adesão',
  'Tamanho de Mercado': 'Tamanho de Mercado',
  'Crescimento de Mercado': 'Crescimento de Mercado',
  'Vulnerabilidade': 'Vulnerabilidade',
  'Volume de Concorrentes': 'Volume de Concorrentes',
};

// --- Updated Technical Note Content ---
const textoDaNota = `
A <strong>Matriz GE</strong> é uma ferramenta de <strong>análise estratégica</strong> desenvolvida para ajudar empresas a <strong>avaliar o portfólio de produtos</strong>. Ela foi criada pela consultoria McKinsey em parceria com a General Electric como uma <strong>evolução da Matriz BCG</strong>. É composta por uma <strong>grade 3x3</strong> (nove quadrantes), que avalia cada produto com base em dois critérios principais:

1. <strong>Atratividade de Mercado</strong> (eixo vertical):
  • Avalia o quão atraente é o mercado para este produto.
  • Fatores considerados: tamanho de mercado, crescimento de mercado, vulnerabilidade de mercado e volume de concorrentes.

2. <strong>Posição Competitiva</strong> (eixo horizontal):
  • Mede o quão bem-posicionado o produto está em relação ao mercado.
  • Fatores considerados: faturamento, satisfação de clientes, capacidade de oferta e facilidade de adesão.

Esses dois eixos são divididos em <strong>baixo</strong>, <strong>médio</strong> e <strong>alto</strong>, gerando nove zonas diferentes.

• <strong>Investir / Crescer (zona superior direita)</strong>:
  • Alta atratividade + alta força competitiva.
  • Estratégia: expandir, alocar recursos, inovar.

• <strong>Selecionar / Manter (zonas centrais)</strong>:
  • Atração e força competitiva medianas.
  • Estratégia: manter o desempenho atual, avaliar oportunidades com cautela.

• <strong>Desinvestir / Colher (zona inferior esquerda)</strong>:
  • Baixa atratividade + baixa força competitiva.
  • Estratégia: reduzir investimentos, sair do mercado.

Para os itens de análise interna foram considerados os 3 últimos anos. Os intervalos de classificação são:

<strong>Faturamento</strong>
Nota 1: valor igual ou inferior a R$ 100.000,00 (Habilitação Técnica) | igual ou inferior a R$ 75.000,00 (Qualificação Profissional)
Nota 2: valor entre R$ 100.000,01 e R$ 250.000,00 (Habilitação Técnica) | entre R$ 75.000,01 e R$ 200.000,00 (Qualificação Profissional)
Nota 3: valor entre R$ 250.000,01 e R$ 300.000,00 (Habilitação Técnica) | entre R$ 200.000,01 e R$ 400.000,00 (Qualificação Profissional)
Nota 4: valor entre R$ 300.000,01 e R$ 600.000,00 (Habilitação Técnica) | entre R$ 400.000,01 e R$ 800.000,00 (Qualificação Profissional)
Nota 5: valor acima de R$ 600.000,00 (Habilitação Técnica) | acima de R$ 800.000,00 (Qualificação Profissional)

<strong>Satisfação</strong>
Nota 1: NPS até 20%
Nota 2: NPS entre 21% e 40%
Nota 3: NPS entre 41% e 60%
Nota 4: NPS entre 61% e 80%
Nota 5: NPS acima de 80%

<strong>Capacidade de Oferta (execução do planejamento)</strong>
Nota 1: menor ou igual que 50%
Nota 2: maior que 50% e menor ou igual que 70%
Nota 3: maior que 70% e menor ou igual que 80%
Nota 4: maior que 80% e menor ou igual que 90%
Nota 5: maior que 90%

<strong>Facilidade de Adesão (fechamento de turmas)</strong>
Nota 1: maior que 120 dias
Nota 2: maior que 100 dias e menor ou igual que 120 dias
Nota 3: maior que 80 dias e menor ou igual que 100 dias
Nota 4: maior que 60 dias e menor ou igual que 80 dias
Nota 5: menor ou igual que 60 dias

<strong>Tamanho de Mercado (estoque de empregos)</strong>
Nota 1: saldo menor ou igual a 500 horas (Habilitação Técnica) | menor ou igual a 100 horas (Qualificação)
Nota 2: saldo entre 501 e 1000 horas (Habilitação Técnica) | entre 101 e 500 horas (Qualificação)
Nota 3: saldo entre 1001 e 2000 horas (Habilitação Técnica) | entre 501 e 1200 horas (Qualificação)
Nota 4: saldo entre 2001 e 3000 horas (Habilitação Técnica) | entre 1201 e 2500 horas (Qualificação)
Nota 5: saldo acima de 3000 horas (Habilitação Técnica) | acima de 2500 horas (Qualificação)

<strong>Crescimento de Mercado (produto entre o estoque de empregos e o Mapa do Trabalho)</strong>
Nota 1: resultado igual ou inferior a 20.000 (Habilitação Técnica) | igual ou inferior a 0 (Qualificação)
Nota 2: resultado entre 20.001 e 40.000 (Habilitação Técnica) | entre 1 e 1.000 (Qualificação)
Nota 3: resultado entre 40.001 e 60.000 (Habilitação Técnica) | entre 1.001 e 2.500 (Qualificação)
Nota 4: resultado entre 60.001 e 80.000 (Habilitação Técnica) | entre 2.501 e 4.500 (Qualificação Profissional)
Nota 5: resultado acima de 80.000 (Habilitação Técnica) | acima de 4.500 (Qualificação)

<strong>Vulnerabilidade (sensibilidade aos fatores externos – análise PESTEL)</strong>
Nota 5: cenário muito favorável
Nota 4: cenário favorável
Nota 3: cenário neutro
Nota 2: cenário desfavorável
Nota 1: cenário muito desfavorável

<strong>Volume de Concorrentes</strong>
Nota 5: nenhum concorrente relevante
Nota 4: há concorrentes, mas nenhum relevante
Nota 3: há concorrentes, mas somente 1 é relevante
Nota 2: há concorrentes e 2 são relevantes
Nota 1: há 3 ou mais concorrentes relevantes
`;

// --- Plotly Chart Fallback Component ---
const PlotlyLoadingFallback = () => {
  // `useMantineTheme` and Mantine components are no longer available in the provided context.
  // This component needs to be re-implemented without Mantine dependencies if it's to be used.
  // For now, returning a basic div with a placeholder text.
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
        backgroundColor: 'rgba(255, 255, 255, 0.8)', // Semi-transparent white background
        fontFamily: 'Josefin Sans, Arial, sans-serif',
        color: 'black',
      }}
    >
      Carregando gráfico...
    </div>
  );
};

// --- Dynamic Import for Plotly using React.lazy ---
const Plot = lazy(() => import('react-plotly.js'));

// --- FilterPopover Component ---
function FilterPopover({ labelText, options, selectedValues, onChange, buttonId, opened, onOpenChange, colorScheme = 'light', enableSearch = false }) {
  const fixed_button_width = '120px';
  // Agora o tema usa o colorScheme recebido por prop
  const theme = {
    colorScheme,
    black: 'black',
    colors: {
      gray: ['#f8f9fa', '#e9ecef', '#dee2e6', '#ced4da', '#adb5bd', '#6c757d', '#495057', '#343a40', '#212529'],
    },
  };

  const clearSelected = useCallback(() => {
    onChange([]);
  }, [onChange]);

  const getButtonText = useCallback(() => {
    if (!selectedValues || selectedValues.length === 0) return labelText;
    if (selectedValues.length === 1) {
      // Buscar o label correspondente ao value selecionado
      const selectedOption = options.find(opt => String(opt.value) === String(selectedValues[0]));
      const txt = selectedOption ? selectedOption.label : String(selectedValues[0]);
      const max_l = Math.floor((parseInt(fixed_button_width) - 50) / 8);
      return txt.length <= max_l ? txt : txt.substring(0, max_l - 3) + '...';
    }
    // Pluralização inteligente
    let plural = labelText;
    switch (labelText.toLowerCase()) {
      case 'área':
        plural = 'áreas selecionadas';
        break;
      case 'quadrante':
        plural = 'quadrantes selecionados';
        break;
      case 'produto':
        plural = 'produtos selecionados';
        break;
      case 'modalidade':
        plural = 'modalidades selecionadas';
        break;
      default:
        plural = labelText + 's selecionados';
    }
    return `${selectedValues.length} ${plural}`;
  }, [selectedValues, labelText, fixed_button_width, options]);

  // --- NOVO: Estado para busca textual ---
  const [searchText, setSearchText] = useState('');
  const filteredOptions = useMemo(() => {
    if (!enableSearch || !searchText.trim()) return options;
    const lower = searchText.trim().toLowerCase();
    return options.filter(opt => String(opt.label).toLowerCase().includes(lower));
  }, [options, searchText, enableSearch]);

  // --- NOVO: Controle de hover para evitar fechamento prematuro ---
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  const [isPopoverHovered, setIsPopoverHovered] = useState(false);
  const [closeTimeout, setCloseTimeout] = useState(null);

  // Função para tentar fechar o popover apenas se ambos não estão hovered
  const tryClosePopover = useCallback((source) => {
    setCloseTimeout((oldTimeout) => {
      if (oldTimeout) clearTimeout(oldTimeout);
      // Se saiu do botão e o popover não está hovered, fecha imediatamente
      if (source === 'button' && !isPopoverHovered) {
        onOpenChange(false);
        return null;
      }
      // Se saiu do popover e o botão não está hovered, fecha imediatamente
      if (source === 'popover' && !isButtonHovered) {
        onOpenChange(false);
        return null;
      }
      // Se está trocando entre eles, usa delay
      return setTimeout(() => {
        if (!isButtonHovered && !isPopoverHovered) {
          onOpenChange(false);
        }
      }, 180);
    });
  }, [isButtonHovered, isPopoverHovered, onOpenChange]);

  // Limpa timeout ao desmontar e ao abrir
  useEffect(() => {
    if (opened && closeTimeout) {
      clearTimeout(closeTimeout);
      setCloseTimeout(null);
    }
    return () => {
      if (closeTimeout) clearTimeout(closeTimeout);
    };
  }, [opened, closeTimeout]);

  // --- NOVO: Estado para animação suave ---
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    if (opened) {
      setIsVisible(true);
    } else if (isVisible) {
      // Aguarda a animação antes de remover do DOM
      const timeout = setTimeout(() => setIsVisible(false), 180);
      return () => clearTimeout(timeout);
    }
  }, [opened, isVisible]);

  return (
    <div style={{ position: 'relative' }}>
      <button
        id={buttonId}
        style={{
          width: fixed_button_width,
          height: '40px',
          padding: '2px 30px 2px 10px',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          textAlign: 'left',
          overflow: 'hidden',
          borderRadius: '6px',
          lineHeight: 1,
          border: '1px solid ' + (theme.colorScheme === 'dark' ? 'gray' : '#e6ebee'),
          backgroundColor: theme.colorScheme === 'dark' ? '#282828' : '#ffffff',
          color: theme.colorScheme === 'dark' ? '#8b8b8b' : '#949494',
          fontFamily: 'Roboto Flex, Arial, sans-serif',
          cursor: 'pointer',
        }}
        onClick={() => onOpenChange(!opened)}
        aria-haspopup="listbox"
        aria-expanded={opened}
        aria-controls={buttonId + '-listbox'}
        onMouseEnter={() => {
          setIsButtonHovered(true);
          if (closeTimeout) {
            clearTimeout(closeTimeout);
            setCloseTimeout(null);
          }
          // Sempre abre o popover deste botão imediatamente
          onOpenChange(true);
        }}
        onMouseLeave={() => {
          setIsButtonHovered(false);
          tryClosePopover('button');
        }}
      >
        <div
          style={{
            flexGrow: 1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontSize: '0.8rem',
            color: theme.colorScheme === 'dark' ? '#8b8b8b' : '#949494',
            lineHeight: 1,
            fontFamily: 'Roboto Flex, Arial, sans-serif',
          }}
        >
          {getButtonText()}
        </div>

        {selectedValues && selectedValues.length > 0 && (
          <div
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              clearSelected();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                clearSelected();
              }
            }}
            style={{
              position: 'absolute',
              right: '28px',
              top: '50%',
              transform: 'translateY(-50%)',
              cursor: 'pointer',
              zIndex: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 16,
              height: 16,
              borderRadius: '6px',
              backgroundColor: 'rgba(0,0,0,0.05)',
            }}
            aria-label={`Limpar filtro de ${labelText}`}
          >
            {/* Replaced IconX with simple SVG */}
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={theme.colorScheme === 'dark' ? DARK_MODE_FONT_COLOR : theme.black} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </div>
        )}

        <div
          style={{
            position: 'absolute',
            right: '8px',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          {/* Replaced IconChevronDown with simple SVG */}
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.colorScheme === 'dark' ? DARK_MODE_FONT_COLOR : '#949494'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </button>

      {isVisible && (
        <div
          style={{
            position: 'absolute',
            zIndex: 10,
            marginTop: '4px',
            maxHeight: '200px',
            overflowY: 'auto',
            minWidth: '120px',
            width: 'max-content',
            padding: '8px',
            border: '1px solid ' + (theme.colorScheme === 'dark' ? '#555' : '#eee'), // Mock border
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)', // Mock shadow
            backgroundColor: theme.colorScheme === 'dark' ? '#444' : 'white', // Mock background
            opacity: opened ? 1 : 0,
            transform: opened ? 'translateY(0)' : 'translateY(-8px)',
            transition: 'opacity 180ms cubic-bezier(.4,0,.2,1), transform 180ms cubic-bezier(.4,0,.2,1)',
          }}
          id={buttonId + '-listbox'}
          role="listbox"
          aria-multiselectable="true"
          onMouseEnter={() => {
            setIsPopoverHovered(true);
            if (closeTimeout) {
              clearTimeout(closeTimeout);
              setCloseTimeout(null);
            }
            // Garante que o popover permanece aberto
            onOpenChange(true);
          }}
          onMouseLeave={() => {
            setIsPopoverHovered(false);
            tryClosePopover('popover');
          }}
        >
          {/* Campo de busca textual, se habilitado */}
          {enableSearch && (
            <div style={{ marginBottom: 8 }}>
              <input
                type="text"
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                placeholder="Buscar..."
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: 4,
                  border: '1px solid ' + (theme.colorScheme === 'dark' ? '#888' : '#ccc'),
                  fontSize: '0.85rem',
                  fontFamily: 'Roboto Flex, Arial, sans-serif',
                  background: theme.colorScheme === 'dark' ? '#232323' : '#f8f9fa',
                  color: theme.colorScheme === 'dark' ? '#fff' : theme.black,
                  marginBottom: 2,
                }}
                autoFocus
              />
            </div>
          )}
          {options.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {filteredOptions.map((opt) => (
                <label key={String(opt.value)} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '0.8rem', color: theme.colorScheme === 'dark' ? DARK_MODE_FONT_COLOR : theme.black, fontFamily: 'Roboto Flex, Arial, sans-serif' }}>
                  <input
                    type="checkbox"
                    value={String(opt.value)}
                    checked={selectedValues.includes(String(opt.value))}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onChange([...selectedValues, String(opt.value)]);
                      } else {
                        onChange(selectedValues.filter((val) => val !== String(opt.value)));
                      }
                    }}
                    style={{ marginRight: '8px' }}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          ) : (
            <p
              style={{
                fontSize: '0.75rem',
                color: theme.colorScheme === 'dark'
                  ? DARK_MODE_FONT_COLOR
                  : theme.colors.gray[7],
              }}
            >
              Nenhuma opção disponível
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// --- FilterPopoverHierarchical Component ---
function FilterPopoverHierarchical({ labelText, criteriosConfig, selectedCriterios, onChange, buttonId, opened, onOpenChange, colorScheme = 'light', showTooltip, hideTooltip, tooltipInfo }) {
  const fixed_button_width = '120px';
  const theme = {
    colorScheme,
    black: 'black',
    colors: {
      gray: ['#f8f9fa', '#e9ecef', '#dee2e6', '#ced4da', '#adb5bd', '#6c757d', '#495057', '#343a40', '#212529'],
    },
  };

  const clearSelected = useCallback(() => {
    onChange([]);
  }, [onChange]);

  const getButtonText = useCallback(() => {
    if (!selectedCriterios || selectedCriterios.length === 0) return labelText;
    if (selectedCriterios.length === 1) {
      const criterio = selectedCriterios[0];
      const criterioName = criterio.split(':')[0];
      const nota = criterio.split(':')[1];
      const txt = `${criterioName} - Nota ${nota}`;
      const max_l = Math.floor((parseInt(fixed_button_width) - 50) / 8);
      return txt.length <= max_l ? txt : txt.substring(0, max_l - 3) + '...';
    }
    return `${selectedCriterios.length} critérios selecionados`;
  }, [selectedCriterios, labelText, fixed_button_width]);

  // --- Controle de hover para evitar fechamento prematuro ---
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  const [isPopoverHovered, setIsPopoverHovered] = useState(false);
  const [closeTimeout, setCloseTimeout] = useState(null);
  const [expandedCriterios, setExpandedCriterios] = useState(new Set());

  const tryClosePopover = useCallback((source) => {
    setCloseTimeout((oldTimeout) => {
      if (oldTimeout) clearTimeout(oldTimeout);
      if (source === 'button' && !isPopoverHovered) {
        onOpenChange(false);
        return null;
      }
      if (source === 'popover' && !isButtonHovered) {
        onOpenChange(false);
        return null;
      }
      return setTimeout(() => {
        if (!isButtonHovered && !isPopoverHovered) {
          onOpenChange(false);
        }
      }, 180);
    });
  }, [isButtonHovered, isPopoverHovered, onOpenChange]);

  useEffect(() => {
    if (opened && closeTimeout) {
      clearTimeout(closeTimeout);
      setCloseTimeout(null);
    }
    return () => {
      if (closeTimeout) clearTimeout(closeTimeout);
    };
  }, [opened, closeTimeout]);

  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    if (opened) {
      setIsVisible(true);
    } else if (isVisible) {
      const timeout = setTimeout(() => setIsVisible(false), 180);
      return () => clearTimeout(timeout);
    }
  }, [opened, isVisible]);

  const toggleCriterio = (criterioName) => {
    setExpandedCriterios(prev => {
      const newSet = new Set(prev);
      if (newSet.has(criterioName)) {
        newSet.delete(criterioName);
      } else {
        newSet.add(criterioName);
      }
      return newSet;
    });
  };

  const handleNotaChange = (criterioName, nota, checked) => {
    const criterioKey = `${criterioName}:${nota}`;
    if (checked) {
      onChange([...selectedCriterios, criterioKey]);
    } else {
      onChange(selectedCriterios.filter(c => c !== criterioKey));
    }
  };

  const isNotaSelected = (criterioName, nota) => {
    return selectedCriterios.includes(`${criterioName}:${nota}`);
  };

  // --- NOVO: Definir grupos de critérios ---
  const POSICAO_COMPETITIVA = [
    'Faturamento',
    'Satisfação',
    'Capacidade de Oferta',
    'Facilidade de Adesão',
  ];
  const ATRATIVIDADE_MERCADO = [
    'Tamanho de Mercado',
    'Crescimento de Mercado',
    'Vulnerabilidade',
    'Volume de Concorrentes',
  ];

  return (
    <div style={{ position: 'relative' }}>
      <button
        id={buttonId}
        style={{
          width: fixed_button_width,
          height: '40px',
          padding: '2px 30px 2px 10px',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          textAlign: 'left',
          overflow: 'hidden',
          borderRadius: '6px',
          lineHeight: 1,
          border: '1px solid ' + (theme.colorScheme === 'dark' ? 'gray' : '#e6ebee'),
          backgroundColor: theme.colorScheme === 'dark' ? '#282828' : '#ffffff',
          color: theme.colorScheme === 'dark' ? '#8b8b8b' : '#949494',
          fontFamily: 'Roboto Flex, Arial, sans-serif',
          cursor: 'pointer',
        }}
        onClick={() => onOpenChange(!opened)}
        aria-haspopup="listbox"
        aria-expanded={opened}
        aria-controls={buttonId + '-listbox'}
        onMouseEnter={() => {
          setIsButtonHovered(true);
          if (closeTimeout) {
            clearTimeout(closeTimeout);
            setCloseTimeout(null);
          }
          onOpenChange(true);
        }}
        onMouseLeave={() => {
          setIsButtonHovered(false);
          tryClosePopover('button');
        }}
      >
        <div
          style={{
            flexGrow: 1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontSize: '0.8rem',
            color: theme.colorScheme === 'dark' ? '#8b8b8b' : '#949494',
            lineHeight: 1,
            fontFamily: 'Roboto Flex, Arial, sans-serif',
          }}
        >
          {getButtonText()}
        </div>

        {selectedCriterios && selectedCriterios.length > 0 && (
          <div
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              clearSelected();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                clearSelected();
              }
            }}
            style={{
              position: 'absolute',
              right: '28px',
              top: '50%',
              transform: 'translateY(-50%)',
              cursor: 'pointer',
              zIndex: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 16,
              height: 16,
              borderRadius: '6px',
              backgroundColor: 'rgba(0,0,0,0.05)',
            }}
            aria-label={`Limpar filtro de ${labelText}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={theme.colorScheme === 'dark' ? DARK_MODE_FONT_COLOR : theme.black} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </div>
        )}

        <div
          style={{
            position: 'absolute',
            right: '8px',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.colorScheme === 'dark' ? DARK_MODE_FONT_COLOR : '#949494'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </button>

      {isVisible && (
        <div
          style={{
            position: 'absolute',
            zIndex: 10,
            marginTop: '4px',
            minWidth: '280px',
            width: 'max-content',
            padding: '8px',
            border: '1px solid ' + (theme.colorScheme === 'dark' ? '#555' : '#eee'),
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            backgroundColor: theme.colorScheme === 'dark' ? '#444' : 'white',
            opacity: opened ? 1 : 0,
            transform: opened ? 'translateY(0)' : 'translateY(-8px)',
            transition: 'opacity 180ms cubic-bezier(.4,0,.2,1), transform 180ms cubic-bezier(.4,0,.2,1)',
            overflow: 'visible', // permite que tooltips ultrapassem
          }}
          id={buttonId + '-listbox'}
          role="listbox"
          aria-multiselectable="true"
          onMouseEnter={() => {
            setIsPopoverHovered(true);
            if (closeTimeout) {
              clearTimeout(closeTimeout);
              setCloseTimeout(null);
            }
            onOpenChange(true);
          }}
          onMouseLeave={() => {
            setIsPopoverHovered(false);
            tryClosePopover('popover');
          }}
        >
          {/* Conteúdo da lista com rolagem e fundo */}
          <div style={{ maxHeight: '300px', overflowY: 'auto', backgroundColor: theme.colorScheme === 'dark' ? '#444' : 'white' }}>
            {/* Cabeçalho: Posição Competitiva */}
            <div
              style={{
                fontWeight: 'bold',
                fontSize: '0.85rem',
                color: theme.colorScheme === 'dark' ? DARK_MODE_FONT_COLOR : theme.black,
                margin: '8px 0 4px 0',
                background: theme.colorScheme === 'dark' ? '#554c1a' : '#fff9db',
                padding: '6px 12px',
                borderBottom: '1px solid ' + (theme.colorScheme === 'dark' ? '#a08c3a' : '#ffe066'),
                letterSpacing: '0.01em',
                boxShadow: theme.colorScheme === 'dark' ? '0 1px 2px rgba(0,0,0,0.08)' : '0 1px 2px rgba(0,0,0,0.04)',
              }}
            >
              Posição Competitiva
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {POSICAO_COMPETITIVA.map((criterioName) => {
                const criterioData = criteriosConfig[criterioName];
                if (!criterioData) return null;
                return (
                  <div key={criterioName} style={{ borderBottom: '1px solid ' + (theme.colorScheme === 'dark' ? '#555' : '#eee'), paddingBottom: '4px' }}>
                    {/* ...código do critério (copiado do map anterior)... */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        color: theme.colorScheme === 'dark' ? DARK_MODE_FONT_COLOR : theme.black,
                        fontFamily: 'Roboto Flex, Arial, sans-serif',
                        padding: '4px 0',
                      }}
                      onClick={() => toggleCriterio(criterioName)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={theme.colorScheme === 'dark' ? DARK_MODE_FONT_COLOR : theme.black}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                          marginRight: '8px',
                          transform: expandedCriterios.has(criterioName) ? 'rotate(90deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s ease',
                        }}
                      >
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                      {criterioName}
                      {/* ...tooltips dos critérios... */}
                      {criterioName === 'Faturamento' && (
                        <div style={{ position: 'relative', marginLeft: '4px', display: 'flex', alignItems: 'center', overflow: 'visible', zIndex: 9999 }}>
                          <span
                            className="material-icons-outlined"
                            style={{
                              fontSize: '16px',
                              color: theme.colorScheme === 'dark' ? '#b0b0b0' : '#888',
                              cursor: 'pointer',
                              verticalAlign: 'middle',
                              display: 'flex',
                              alignItems: 'center',
                              lineHeight: 1,
                            }}
                            onMouseEnter={e => {
                              e.stopPropagation();
                              const rect = e.currentTarget.getBoundingClientRect();
                              showTooltip('Para análise, foram consideradas as receitas de balcão e proposta dos últimos 3 anos.\n\nQuanto maior, melhor.', rect);
                            }}
                            onMouseLeave={e => {
                              e.stopPropagation();
                              hideTooltip();
                            }}
                            tabIndex={0}
                            aria-label="Explicação sobre faturamento"
                          >
                            help_outline
                          </span>
                        </div>
                      )}
                      {criterioName === 'Satisfação' && (
                        <div style={{ position: 'relative', marginLeft: '4px', display: 'flex', alignItems: 'center', overflow: 'visible', zIndex: 9999 }}>
                          <span
                            className="material-icons-outlined"
                            style={{
                              fontSize: '16px',
                              color: theme.colorScheme === 'dark' ? '#b0b0b0' : '#888',
                              cursor: 'pointer',
                              verticalAlign: 'middle',
                              display: 'flex',
                              alignItems: 'center',
                              lineHeight: 1,
                            }}
                            onMouseEnter={e => {
                              e.stopPropagation();
                              const rect = e.currentTarget.getBoundingClientRect();
                              showTooltip('Qualidade da prestação do serviço e entrega de valor aos consumidores.\n\nQuanto maior, melhor.', rect);
                            }}
                            onMouseLeave={e => {
                              e.stopPropagation();
                              hideTooltip();
                            }}
                            tabIndex={0}
                            aria-label="Explicação sobre satisfação"
                          >
                            help_outline
                          </span>
                        </div>
                      )}
                      {criterioName === 'Capacidade de Oferta' && (
                        <div style={{ position: 'relative', marginLeft: '4px', display: 'flex', alignItems: 'center', overflow: 'visible', zIndex: 9999 }}>
                          <span
                            className="material-icons-outlined"
                            style={{
                              fontSize: '16px',
                              color: theme.colorScheme === 'dark' ? '#b0b0b0' : '#888',
                              cursor: 'pointer',
                              verticalAlign: 'middle',
                              display: 'flex',
                              alignItems: 'center',
                              lineHeight: 1,
                            }}
                            onMouseEnter={e => {
                              e.stopPropagation();
                              const rect = e.currentTarget.getBoundingClientRect();
                              showTooltip('É a nossa capacidade de ofertar um produto com agilidade e frequência.\n\nQuanto maior, melhor.', rect);
                            }}
                            onMouseLeave={e => {
                              e.stopPropagation();
                              hideTooltip();
                            }}
                            tabIndex={0}
                            aria-label="Explicação sobre capacidade de oferta"
                          >
                            help_outline
                          </span>
                        </div>
                      )}
                      {criterioName === 'Facilidade de Adesão' && (
                        <div style={{ position: 'relative', marginLeft: '4px', display: 'flex', alignItems: 'center', overflow: 'visible', zIndex: 9999 }}>
                          <span
                            className="material-icons-outlined"
                            style={{
                              fontSize: '16px',
                              color: theme.colorScheme === 'dark' ? '#b0b0b0' : '#888',
                              cursor: 'pointer',
                              verticalAlign: 'middle',
                              display: 'flex',
                              alignItems: 'center',
                              lineHeight: 1,
                            }}
                            onMouseEnter={e => {
                              e.stopPropagation();
                              const rect = e.currentTarget.getBoundingClientRect();
                              showTooltip('Facilidade para fechar a quantidade mínima de alunos para rodar uma turma (com base no histórico dos últimos 3 anos).\n\nQuanto maior, melhor.', rect);
                            }}
                            onMouseLeave={e => {
                              e.stopPropagation();
                              hideTooltip();
                            }}
                            tabIndex={0}
                            aria-label="Explicação sobre facilidade de adesão"
                          >
                            help_outline
                          </span>
                        </div>
                      )}
                      {criterioName === 'Tamanho de Mercado' && (
                        <div style={{ position: 'relative', marginLeft: '4px', display: 'flex', alignItems: 'center', overflow: 'visible', zIndex: 9999 }}>
                          <span
                            className="material-icons-outlined"
                            style={{
                              fontSize: '16px',
                              color: theme.colorScheme === 'dark' ? '#b0b0b0' : '#888',
                              cursor: 'pointer',
                              verticalAlign: 'middle',
                              display: 'flex',
                              alignItems: 'center',
                              lineHeight: 1,
                            }}
                            onMouseEnter={e => {
                              e.stopPropagation();
                              const rect = e.currentTarget.getBoundingClientRect();
                              showTooltip('É o estoque atual de colaboradores em empresas do setor (CAGED).\n\nQuanto maior, melhor.', rect);
                            }}
                            onMouseLeave={e => {
                              e.stopPropagation();
                              hideTooltip();
                            }}
                            tabIndex={0}
                            aria-label="Explicação sobre tamanho de mercado"
                          >
                            help_outline
                          </span>
                        </div>
                      )}
                      {criterioName === 'Crescimento de Mercado' && (
                        <div style={{ position: 'relative', marginLeft: '4px', display: 'flex', alignItems: 'center', overflow: 'visible', zIndex: 9999 }}>
                          <span
                            className="material-icons-outlined"
                            style={{
                              fontSize: '16px',
                              color: theme.colorScheme === 'dark' ? '#b0b0b0' : '#888',
                              cursor: 'pointer',
                              verticalAlign: 'middle',
                              display: 'flex',
                              alignItems: 'center',
                              lineHeight: 1,
                            }}
                            onMouseEnter={e => {
                              e.stopPropagation();
                              const rect = e.currentTarget.getBoundingClientRect();
                              showTooltip('Relação entre o saldo CAGED e a demanda por formação do Mapa do Trabalho.\n\nQuanto maior, melhor.', rect);
                            }}
                            onMouseLeave={e => {
                              e.stopPropagation();
                              hideTooltip();
                            }}
                            tabIndex={0}
                            aria-label="Explicação sobre crescimento de mercado"
                          >
                            help_outline
                          </span>
                        </div>
                      )}
                      {criterioName === 'Vulnerabilidade' && (
                        <div style={{ position: 'relative', marginLeft: '4px', display: 'flex', alignItems: 'center', overflow: 'visible', zIndex: 9999 }}>
                          <span
                            className="material-icons-outlined"
                            style={{
                              fontSize: '16px',
                              color: theme.colorScheme === 'dark' ? '#b0b0b0' : '#888',
                              cursor: 'pointer',
                              verticalAlign: 'middle',
                              display: 'flex',
                              alignItems: 'center',
                              lineHeight: 1,
                            }}
                            onMouseEnter={e => {
                              e.stopPropagation();
                              const rect = e.currentTarget.getBoundingClientRect();
                              showTooltip('Sensibilidade do setor aos fatores externos, avaliado pela análise PESTAL (Política, Economia, Social, Tecnologia, Ambiental e Legal).\n\nQuanto menor, melhor.', rect);
                            }}
                            onMouseLeave={e => {
                              e.stopPropagation();
                              hideTooltip();
                            }}
                            tabIndex={0}
                            aria-label="Explicação sobre vulnerabilidade"
                          >
                            help_outline
                          </span>
                        </div>
                      )}
                      {criterioName === 'Volume de Concorrentes' && (
                        <div style={{ position: 'relative', marginLeft: '4px', display: 'flex', alignItems: 'center', overflow: 'visible', zIndex: 9999 }}>
                          <span
                            className="material-icons-outlined"
                            style={{
                              fontSize: '16px',
                              color: theme.colorScheme === 'dark' ? '#b0b0b0' : '#888',
                              cursor: 'pointer',
                              verticalAlign: 'middle',
                              display: 'flex',
                              alignItems: 'center',
                              lineHeight: 1,
                            }}
                            onMouseEnter={e => {
                              e.stopPropagation();
                              const rect = e.currentTarget.getBoundingClientRect();
                              showTooltip('É o volume de empresas concorrentes (em quantidade e força) naquele mercado, ofertando um produto similar ou substituto.\n\nQuanto menor, melhor.', rect);
                            }}
                            onMouseLeave={e => {
                              e.stopPropagation();
                              hideTooltip();
                            }}
                            tabIndex={0}
                            aria-label="Explicação sobre volume de concorrentes"
                          >
                            help_outline
                          </span>
                        </div>
                      )}
                    </div>
                    {expandedCriterios.has(criterioName) && (
                      <div style={{ marginLeft: '20px', marginTop: '4px' }}>
                        {criterioData.notas.map((nota) => (
                          <label
                            key={`${criterioName}-${nota.valor}`}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              color: theme.colorScheme === 'dark' ? DARK_MODE_FONT_COLOR : theme.black,
                              fontFamily: 'Roboto Flex, Arial, sans-serif',
                              marginBottom: '2px',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isNotaSelected(criterioName, nota.valor)}
                              onChange={(e) => handleNotaChange(criterioName, nota.valor, e.target.checked)}
                              style={{ marginRight: '8px' }}
                            />
                            <span style={{ fontWeight: 'bold', marginRight: '4px' }}>Nota {nota.valor}:</span>
                            <span style={{ fontSize: '0.7rem' }}>{nota.descricao}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Cabeçalho: Atratividade de Mercado */}
            <div
              style={{
                fontWeight: 'bold',
                fontSize: '0.85rem',
                color: theme.colorScheme === 'dark' ? DARK_MODE_FONT_COLOR : theme.black,
                margin: '12px 0 4px 0',
                background: theme.colorScheme === 'dark' ? '#554c1a' : '#fff9db',
                padding: '6px 12px',
                borderBottom: '1px solid ' + (theme.colorScheme === 'dark' ? '#a08c3a' : '#ffe066'),
                letterSpacing: '0.01em',
                boxShadow: theme.colorScheme === 'dark' ? '0 1px 2px rgba(0,0,0,0.08)' : '0 1px 2px rgba(0,0,0,0.04)',
              }}
            >
              Atratividade de Mercado
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {ATRATIVIDADE_MERCADO.map((criterioName) => {
                const criterioData = criteriosConfig[criterioName];
                if (!criterioData) return null;
                return (
                  <div key={criterioName} style={{ borderBottom: '1px solid ' + (theme.colorScheme === 'dark' ? '#555' : '#eee'), paddingBottom: '4px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        color: theme.colorScheme === 'dark' ? DARK_MODE_FONT_COLOR : theme.black,
                        fontFamily: 'Roboto Flex, Arial, sans-serif',
                        padding: '4px 0',
                      }}
                      onClick={() => toggleCriterio(criterioName)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={theme.colorScheme === 'dark' ? DARK_MODE_FONT_COLOR : theme.black}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                          marginRight: '8px',
                          transform: expandedCriterios.has(criterioName) ? 'rotate(90deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s ease',
                        }}
                      >
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                      {criterioName}
                      {criterioName === 'Tamanho de Mercado' && (
                        <div style={{ position: 'relative', marginLeft: '4px', display: 'flex', alignItems: 'center', overflow: 'visible', zIndex: 9999 }}>
                          <span
                            className="material-icons-outlined"
                            style={{
                              fontSize: '16px',
                              color: theme.colorScheme === 'dark' ? '#b0b0b0' : '#888',
                              cursor: 'pointer',
                              verticalAlign: 'middle',
                              display: 'flex',
                              alignItems: 'center',
                              lineHeight: 1,
                            }}
                            onMouseEnter={e => {
                              e.stopPropagation();
                              const rect = e.currentTarget.getBoundingClientRect();
                              showTooltip('É o estoque atual de colaboradores em empresas do setor (CAGED).\n\nQuanto maior, melhor.', rect);
                            }}
                            onMouseLeave={e => {
                              e.stopPropagation();
                              hideTooltip();
                            }}
                            tabIndex={0}
                            aria-label="Explicação sobre tamanho de mercado"
                          >
                            help_outline
                          </span>
                        </div>
                      )}
                      {criterioName === 'Crescimento de Mercado' && (
                        <div style={{ position: 'relative', marginLeft: '4px', display: 'flex', alignItems: 'center', overflow: 'visible', zIndex: 9999 }}>
                          <span
                            className="material-icons-outlined"
                            style={{
                              fontSize: '16px',
                              color: theme.colorScheme === 'dark' ? '#b0b0b0' : '#888',
                              cursor: 'pointer',
                              verticalAlign: 'middle',
                              display: 'flex',
                              alignItems: 'center',
                              lineHeight: 1,
                            }}
                            onMouseEnter={e => {
                              e.stopPropagation();
                              const rect = e.currentTarget.getBoundingClientRect();
                              showTooltip('Relação entre o saldo CAGED e a demanda por formação do Mapa do Trabalho.\n\nQuanto maior, melhor.', rect);
                            }}
                            onMouseLeave={e => {
                              e.stopPropagation();
                              hideTooltip();
                            }}
                            tabIndex={0}
                            aria-label="Explicação sobre crescimento de mercado"
                          >
                            help_outline
                          </span>
                        </div>
                      )}
                      {criterioName === 'Vulnerabilidade' && (
                        <div style={{ position: 'relative', marginLeft: '4px', display: 'flex', alignItems: 'center', overflow: 'visible', zIndex: 9999 }}>
                          <span
                            className="material-icons-outlined"
                            style={{
                              fontSize: '16px',
                              color: theme.colorScheme === 'dark' ? '#b0b0b0' : '#888',
                              cursor: 'pointer',
                              verticalAlign: 'middle',
                              display: 'flex',
                              alignItems: 'center',
                              lineHeight: 1,
                            }}
                            onMouseEnter={e => {
                              e.stopPropagation();
                              const rect = e.currentTarget.getBoundingClientRect();
                              showTooltip('Sensibilidade do setor aos fatores externos, avaliado pela análise PESTAL (Política, Economia, Social, Tecnologia, Ambiental e Legal).\n\nQuanto menor, melhor.', rect);
                            }}
                            onMouseLeave={e => {
                              e.stopPropagation();
                              hideTooltip();
                            }}
                            tabIndex={0}
                            aria-label="Explicação sobre vulnerabilidade"
                          >
                            help_outline
                          </span>
                        </div>
                      )}
                      {criterioName === 'Volume de Concorrentes' && (
                        <div style={{ position: 'relative', marginLeft: '4px', display: 'flex', alignItems: 'center', overflow: 'visible', zIndex: 9999 }}>
                          <span
                            className="material-icons-outlined"
                            style={{
                              fontSize: '16px',
                              color: theme.colorScheme === 'dark' ? '#b0b0b0' : '#888',
                              cursor: 'pointer',
                              verticalAlign: 'middle',
                              display: 'flex',
                              alignItems: 'center',
                              lineHeight: 1,
                            }}
                            onMouseEnter={e => {
                              e.stopPropagation();
                              const rect = e.currentTarget.getBoundingClientRect();
                              showTooltip('É o volume de empresas concorrentes (em quantidade e força) naquele mercado, ofertando um produto similar ou substituto.\n\nQuanto menor, melhor.', rect);
                            }}
                            onMouseLeave={e => {
                              e.stopPropagation();
                              hideTooltip();
                            }}
                            tabIndex={0}
                            aria-label="Explicação sobre volume de concorrentes"
                          >
                            help_outline
                          </span>
                        </div>
                      )}
                    </div>
                    {expandedCriterios.has(criterioName) && (
                      <div style={{ marginLeft: '20px', marginTop: '4px' }}>
                        {criterioData.notas.map((nota) => (
                          <label
                            key={`${criterioName}-${nota.valor}`}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              color: theme.colorScheme === 'dark' ? DARK_MODE_FONT_COLOR : theme.black,
                              fontFamily: 'Roboto Flex, Arial, sans-serif',
                              marginBottom: '2px',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isNotaSelected(criterioName, nota.valor)}
                              onChange={(e) => handleNotaChange(criterioName, nota.valor, e.target.checked)}
                              style={{ marginRight: '8px' }}
                            />
                            <span style={{ fontWeight: 'bold', marginRight: '4px' }}>Nota {nota.valor}:</span>
                            <span style={{ fontSize: '0.7rem' }}>{nota.descricao}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- AppSidebar Component ---
function AppSidebar({ colorScheme, currentPage, onNavChange }) {
  const router = useRouter();
  // `useMantineTheme` is no longer available. Using hardcoded colors.
  const theme = {
    colorScheme: colorScheme,
    white: 'white',
    black: 'black',
    colors: {
      gray: ['#f8f9fa', '#e9ecef', '#dee2e6', '#ced4da', '#adb5bd', '#6c757d', '#495057', '#343a40', '#212529'],
      blue: ['#e7f5ff', '#d0ebff', '#a5d8ff', '#74c0fc', '#4dabf7', '#339af0', '#228be6', '#1971c2', '#1864ab'],
    },
    spacing: { sm: '8px' },
    primaryColor: 'blue',
  };

  const mainContentBg = colorScheme === 'dark' ? '#121212' : '#fafafa';
  const sidebarBg = colorScheme === 'dark' ? '#282828' : theme.white;
  // Cor de destaque fixa para ambos os temas
  const accentColor = '#ff3355';
  const textPrimary = colorScheme === 'dark' ? 'rgba(255,255,255,0.87)' : theme.black;
  const textSecondary = colorScheme === 'dark' ? 'rgba(255,255,255,0.6)' : theme.colors.gray[7];
  const borderColor = colorScheme === 'dark' ? '#2C2C2C' : '#e6ebee';
  const surfaceBg = colorScheme === 'dark' ? '#232323' : '#fff';
  const iconActive = accentColor;
  const iconInactive = colorScheme === 'dark' ? '#B0B0B0' : theme.colors.gray[6];

  // Animação de fade-in ao trocar de página
  const [sidebarOpacity, setSidebarOpacity] = useState(1);
  useEffect(() => {
    setSidebarOpacity(0.6);
    const timeout = setTimeout(() => setSidebarOpacity(1), 120);
    return () => clearTimeout(timeout);
  }, [currentPage]);

  const getButtonStyles = (pageName) => {
    const isSelected = currentPage === pageName;
    let hoverBgColor;
    if (isSelected) {
      hoverBgColor = colorScheme === 'dark' ? '#1E293B' : '#F1F5F9';
    } else {
      hoverBgColor = colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    }
    return {
      width: '100%',
      justifyContent: 'center',
      borderLeft: '3px solid transparent',
      borderTop: 'none',
      borderRight: 'none',
      borderBottom: 'none',
      borderRadius: 0,
      transition: 'color 0.4s cubic-bezier(.4,0,.2,1)',
      color: isSelected
        ? accentColor
        : (colorScheme === 'dark' ? '#ffffff' : theme.black),
      padding: '8px',
      fontSize: '1.25rem',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
    };
  };

  const BUTTON_HEIGHT = 44;
  const BUTTON_GAP = 8;
  const selectedIndex = currentPage === 'menu' ? 0 : currentPage === 'matriz' ? 1 : 2;
  const topPosition = selectedIndex * (BUTTON_HEIGHT + BUTTON_GAP);

  return (
    <div
      style={{
        width: SIDEBAR_WIDTH,
        minWidth: SIDEBAR_WIDTH,
        height: '100vh',
        position: 'relative',
        display: 'flex',
        flexDirection: 'row',
        backgroundColor: sidebarBg,
        boxSizing: 'border-box',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      {/* Coluna da barra azul */}
      <div style={{ width: 4, position: 'relative', height: '100%' }}>
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: topPosition,
            width: 4,
            height: BUTTON_HEIGHT,
            background: accentColor,
            borderRadius: 0,
            transition: 'top 0.18s cubic-bezier(.4,0,.2,1), background 0.2s',
          }}
        />
      </div>
      {/* Coluna dos botões */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', gap: BUTTON_GAP }}>
        {/* ...botões aqui, sem paddingLeft extra, sem zIndex... */}
        {/* Copie o bloco dos botões menu, matriz, nota para cá, remova paddingLeft e zIndex deles */}
        {/* ...restante do conteúdo da sidebar... */}
        <button
          title="Voltar ao Menu Principal"
          style={{
            ...getButtonStyles('menu'),
            position: 'relative',
            height: BUTTON_HEIGHT,
            background: currentPage === 'menu'
              ? (colorScheme === 'dark' ? '#121212' : 'transparent')
              : (colorScheme === 'dark' ? '#282828' : '#fff'),
            opacity: 1,
            color: currentPage === 'menu' ? accentColor : (colorScheme === 'dark' ? '#ffffff' : theme.black),
            fontWeight: currentPage === 'menu' ? 600 : 400,
            boxShadow: 'none',
            borderLeft: 'none',
          }}
          onClick={() => router.push('/menu')}
        >
          <span className="material-icons-outlined" style={{ fontSize: 28, color: currentPage === 'menu' ? accentColor : (colorScheme === 'dark' ? '#ffffff' : theme.black) }}>
            arrow_back
          </span>
        </button>
        <button
          title="Matriz GE"
          style={{
            ...getButtonStyles('matriz'),
            position: 'relative',
            height: BUTTON_HEIGHT,
            background: currentPage === 'matriz'
              ? (colorScheme === 'dark' ? '#121212' : 'transparent')
              : (colorScheme === 'dark' ? '#282828' : '#fff'),
            opacity: 1,
            color: currentPage === 'matriz' ? accentColor : (colorScheme === 'dark' ? '#ffffff' : theme.black),
            fontWeight: currentPage === 'matriz' ? 600 : 400,
            boxShadow: 'none',
            borderLeft: 'none',
          }}
          onClick={() => onNavChange('matriz')}
        >
          <span className="material-icons-outlined" style={{ fontSize: 28, color: currentPage === 'matriz' ? accentColor : (colorScheme === 'dark' ? '#ffffff' : theme.black) }}>
            grid_on
          </span>
        </button>
        <button
          title="Nota Técnica"
          style={{
            ...getButtonStyles('nota'),
            position: 'relative',
            height: BUTTON_HEIGHT,
            background: currentPage === 'nota'
              ? (colorScheme === 'dark' ? '#121212' : 'transparent')
              : (colorScheme === 'dark' ? '#282828' : '#fff'),
            opacity: 1,
            color: currentPage === 'nota' ? accentColor : (colorScheme === 'dark' ? '#ffffff' : theme.black),
            fontWeight: currentPage === 'nota' ? 600 : 400,
            boxShadow: 'none',
            borderLeft: 'none',
          }}
          onClick={() => onNavChange('nota')}
        >
          <span className="material-icons-outlined" style={{ fontSize: 28, color: currentPage === 'nota' ? accentColor : (colorScheme === 'dark' ? '#ffffff' : theme.black) }}>
            description
          </span>
        </button>
      </div>
    </div>
  );
}

// --- NotaTecnicaPage Component ---
function NotaTecnicaPage({ colorScheme }) {
  const isDark = colorScheme === 'dark';
  const textColor = isDark ? '#d5dbe3' : '#000';
  const paperBg = isDark ? '#1b2537' : 'white';
  const paperBorder = isDark ? '#555' : '#eee';

  return (
    <div
      style={{ flexGrow: 1, overflowY: 'auto', paddingLeft: '24px', paddingRight: '24px', maxWidth: '100%', boxSizing: 'border-box', paddingTop: 0, marginTop: 0, fontFamily: 'Roboto Flex, Arial, sans-serif' }}
    >
      <h2
        style={{
          textAlign: 'center',
          fontSize: '2rem',
          marginBottom: '16px',
          marginTop: 0,
          fontFamily: 'Roboto Flex, Arial, sans-serif',
          color: colorScheme === 'dark' ? '#ffffff' : textColor,
        }}
      >
        Nota Técnica
      </h2>
      <div style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)', padding: '24px', border: '1px solid ' + paperBg, borderRadius: 0, backgroundColor: colorScheme === 'dark' ? '#282828' : paperBg }}>
        <p
          dangerouslySetInnerHTML={{ __html: textoDaNota.replace(/\n/g, '<br />') }}
          style={{
            fontFamily: 'Roboto Flex, Arial, sans-serif',
            color: colorScheme === 'dark' ? '#ffffff' : textColor,
            fontSize: '0.875rem', // Equivalent to size="sm" or default text size
            lineHeight: 1.5,
          }}
        />
      </div>
    </div>
  );
}

// --- ExplanationContent Component (new) ---
function ExplanationContent({ colorScheme }) {
  // `useMantineTheme` is no longer available.
  const theme = {
    colorScheme: colorScheme,
    black: 'black',
    radius: { md: '8px' }, // Mock radius
    shadows: { xs: '0 1px 2px rgba(0,0,0,0.1)' }, // Mock shadow
  };
  const textColor = colorScheme === 'dark' ? DARK_MODE_FONT_COLOR : theme.black;

  const explanationItems = [
    {
      title: "Investimento Prioritário",
      color: "#55b03e", // COLOR_VERDE_ESCURO
      description: "São Produtos \"Estrelas\": A maior parte da atenção e dos investimentos devem ser dedicadas para fazer com que esses itens cresçam e gerem o máximo de retorno possível para o negócio."
    },
    {
      title: "Investimento Seguro e Crescimento",
      color: "#1cb67b", // COLOR_VERDE_MEDIO
      description: "São Produtos \"Jovens Estrelas\": Uma parte dos investimentos devem ser feitos nesses itens, aproveitando as oportunidades das pontuações mais altas."
    },
    {
      title: "Investimento Seletivo/Cauteloso",
      color: "#ffc000", // COLOR_AMARELO
      description: "São Produtos \"Interrogação\": Existe um risco moderado quanto ao sucesso desses títulos. Só devem receber investimentos se sobrar capital após os investimentos seguros e prioritários."
    },
    {
      title: "Expansão Limitada ou Colheita",
      color: "#f98a0f", // COLOR_LARANJA
      description: "São Produtos \"Vacas Leiteiras\": Se os itens desse quadrante gerarem retorno estratégico, vale a pena investir para que continuem operando. Se não, vale a pena reduzir os investimentos e planejar uma saída gradual."
    },
    {
      title: "Zona de Perigo: Colher ou desinvestir",
      color: "#f0462e", // COLOR_VERMELHO
      description: "São Produtos \"Abacaxis\": Nenhum dos itens apresentam perspectiva de sucesso. É recomendado desinvestir nesses títulos para minimizar perdas futuras."
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap: '32px', width: '100%', maxWidth: '1800px', fontFamily: 'Roboto Flex, Arial, sans-serif' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        {explanationItems.map((item, index) => (
          <div
            key={index}
            style={{
              padding: '12px',
              backgroundColor: item.color,
              borderRadius: theme.radius.md,
              color: 'white',
              fontFamily: 'Roboto Flex, Arial, sans-serif',
              boxShadow: theme.shadows.xs,
            }}
          >
            <p style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '4px' }}>{item.title}</p>
            <p style={{ fontSize: '0.75rem', lineHeight: 1.4 }}>{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- GE Matrix Content Component (without sidebar) ---
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
  plotFigure: plotFigureFromApp,
  setPlotFigure,
  plotRevision: plotRevisionFromApp,
  setPlotRevision,
  getUniqueSortedOptions,
  colorScheme,
  onResetFilters,
  onDownloadRequest,
  openedPopover,
  setOpenedPopover,
  modalidadeOptions,
  selectedModalidades,
  setSelectedModalidades,
  selectedCriterios,
  setSelectedCriterios,
  showTooltip, // <-- Adicionado
  hideTooltip, // <-- Adicionado
  tooltipInfo, // <-- Adicionado
}) {
  // `useMantineTheme` is no longer available.
  const theme = {
    colorScheme: colorScheme,
    black: 'black',
    colors: {
      dark: ['#1a1b1e', '#2c2d30', '#3b3c3f', '#4a4b4e', '#595a5d', '#68696c', '#77787b', '#86878a', '#959699'],
      gray: ['#f8f9fa', '#e9ecef', '#dee2e6', '#ced4da', '#adb5bd', '#6c757d', '#495057', '#343a40', '#212529'],
    },
    spacing: { md: '16px', lg: '24px' },
  };
  const textColor = colorScheme === 'dark' ? DARK_MODE_FONT_COLOR : theme.black;

  // Remover as constantes svgC1C2 e svgC1C2DataUri
  // const svgC1C2 = `<svg version="1.1" ...`;
  // const svgC1C2DataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svgC1C2)}`;

  // useEffect to update plotFigure when data or filters change
  useEffect(() => {
    console.log(
      'MatrizGEPageContent: Plot useEffect triggered. Loading:',
      loadingData,
      'Data length:',
      originalData.length,
      'Error:',
      errorMessage
    );

    if (loadingData && originalData.length === 0 && !errorMessage) {
      console.log(
        'MatrizGEPageContent: Early return from plot useEffect - loading or no data.'
      );
      setPlotFigure({
        data: [],
        layout: {
          plot_bgcolor: 'rgba(0,0,0,0)',
          paper_bgcolor: 'rgba(0,0,0,0)',
          annotations: [
            {
              text: loadingData ? 'Carregando dados...' : 'Sem dados para exibir.',
              xref: 'paper',
              yref: 'paper',
              x: 0.5,
              y: 0.5,
              showarrow: false,
              font: {
                size: 16,
                color: textColor,
                family: 'Roboto Flex, Arial, sans-serif',
              },
            },
          ],
        },
      });
      return;
    }

    let dfPlot = [...originalData];
    // LOG para depuração
    console.log('Modalidades selecionadas:', selectedModalidades);
    console.log('Modalidade do item:', dfPlot.map(i => i[KEY_MODALIDADE]));
    console.log('Dados após filtros - dfPlot.length:', dfPlot.length);
    console.log('Primeiro item dfPlot:', dfPlot[0]);
    console.log('Valores QUADRANTE únicos:', Array.from(new Set(dfPlot.map(i => getQuadranteValue(i)))));
    // APLICAR FILTRO DE MODALIDADE PRIMEIRO
    if (selectedModalidades && selectedModalidades.length > 0)
      dfPlot = dfPlot.filter((item) =>
        selectedModalidades.map(normalizeString).includes(
          normalizeString(item[KEY_MODALIDADE])
        )
      );
    
    // APLICAR FILTRO DE CRITÉRIOS
    if (selectedCriterios && selectedCriterios.length > 0) {
      dfPlot = dfPlot.filter((item) => {
        return selectedCriterios.some(criterioKey => {
          const [criterioName, nota] = criterioKey.split(':');
          // Usar o mapeamento para buscar o nome correto da coluna
          const coluna = CRITERIOS_TO_COLUNAS[criterioName] || criterioName;
          const criterioValue = item[coluna] || item[coluna.toLowerCase()] || item[coluna.toUpperCase()];
          return criterioValue && String(criterioValue).includes(String(nota));
        });
      });
    }
    
    // Depois aplicar os outros filtros
    if (selectedAreas.length > 0)
      dfPlot = dfPlot.filter((item) =>
        selectedAreas.includes(String(item[KEY_GRANDE_AREA]))
      );
    if (selectedQuadrantes.length > 0)
      dfPlot = dfPlot.filter((item) =>
        selectedQuadrantes.includes(String(getQuadranteValue(item)))
      );
    if (selectedProdutos.length > 0)
      dfPlot = dfPlot.filter((item) =>
        selectedProdutos.includes(String(item[KEY_PRODUTO]))
      );

    const productTraces = [];
    const fixed_cor_bolha = '#FFFFFF';
    const fixed_transparencia_percent = 55;
    const minRadius = 1;
    const targetMaxBubbleSize = 150;
    const allSizes = dfPlot.map(item => Math.sqrt(item[KEY_HORA_ALUNO] || 1));
    console.log('Horas-aluno:', dfPlot.map(item => item[KEY_HORA_ALUNO]));
    console.log('allSizes:', allSizes);
    const globalMaxSize = Math.max(...allSizes);
    const globalFatorEscala = globalMaxSize > 0 ? targetMaxBubbleSize / globalMaxSize : 1;
    console.log('globalMaxSize:', globalMaxSize, 'globalFatorEscala:', globalFatorEscala);

    if (dfPlot.length > 0) {
      const quadrantesUnicosPlot = Array.from(
        new Set(
          dfPlot.map((item) => getQuadranteValue(item)).filter((q) => q != null && q !== '')
        )
      );

      quadrantesUnicosPlot.forEach((quadrante) => {
        const df_q = dfPlot.filter(
          (item) => getQuadranteValue(item) === quadrante
        );
        if (df_q.length > 0) {
          const bubbleSizes = df_q.map(item => Math.max(minRadius, Math.sqrt(item[KEY_HORA_ALUNO] || 1) * globalFatorEscala));
          console.log('Tamanhos das bolhas para quadrante', quadrante, ':', bubbleSizes);
          productTraces.push({
            type: 'scatter',
            x: df_q.map((item) => item[KEY_POSICAO_COMPETITIVA]),
            y: df_q.map((item) => item[KEY_ATRATIVIDADE_MERCADO]),
            mode: exibirTexto ? 'markers+text' : 'markers',
            name: String(quadrante ?? 'N/A'),
            marker: {
              size: bubbleSizes,
              color: fixed_cor_bolha,
              opacity: Math.max(0, Math.min(1, (100 - fixed_transparencia_percent) / 100)),
              line: { width: 0, color: 'rgba(0,0,0,0)' }, // Garante que não haverá borda
            },
            cliponaxis: true,
            text: exibirTexto
              ? df_q
                .map((item) => String(item[KEY_PRODUTO] || 'N/A'))
                .map((str) => {
                  if (/^t[ée]cnico em\s/i.test(str)) {
                    return str.replace(/t[ée]cnico em\s/i, (match) => match + '<br>');
                  } else {
                    return str;
                  }
                })
              : undefined,
            textposition: exibirTexto ? 'center' : undefined,
            textfont: {
              color: 'black',
              size: 12,
              family: 'Roboto Flex, Arial, sans-serif',
            },
            customdata: df_q.map((item) => item[KEY_PRODUTO] || 'N/A'),
            hovertemplate:
              '<b>%{customdata}</b><br>Posição: %{x:.1f}<br>Atratividade: %{y:.1f}<extra></extra>',
            layer: 'above',
          });
        }
      });
    } // <-- Certifique-se de que esta chave fecha o bloco do if corretamente

    const div = 10 / 3;
    const COLOR_AMARELO = '#ffc000';
    const COLOR_LARANJA = '#f98a0f';
    const COLOR_VERMELHO = '#f0462e';
    const COLOR_VERDE_MEDIO = '#1cb67b';
    const COLOR_VERDE_ESCURO = '#55b03e';

    const TEXT_COLOR_MY_C1 = '#bf9000';
    const TEXT_COLOR_MY_B1 = '#c5e0b4';
    const TEXT_COLOR_MY_A1 = '#385723';
    const TEXT_COLOR_MY_C2 = '#ffc000';
    const TEXT_COLOR_MY_B2 = '#bf9000';
    const TEXT_COLOR_MY_A2 = '#c5e0b4';
    const TEXT_COLOR_MY_C3 = '#843c0c';
    const TEXT_COLOR_MY_B3 = '#ffc000';
    const TEXT_COLOR_MY_A3 = '#bf9000';

    const svgQuestionMarkPath =
      'M1402 2870 c-127 -18 -262 -72 -363 -146 -66 -48 -178 -171 -218 -237 -66 -112 -108 -241 -118 -367 l-6 -75 190 0 190 0 12 69 c36 214 207 366 410 366 257 -1 457 -244 412 -500 -25 -139 -85 -218 -261 -348 -181 -134 -318 -390 -337 -628 l-6 -84 190 0 189 0 11 68 c23 141 91 260 195 336 139 103 163 124 214 185 67 81 136 211 164 311 32 114 37 280 12 402 -55 266 -237 490 -480 592 -119 50 -278 72 -400 56z m187 -20 c105 -15 174 -36 255 -77 200 -99 353 -293 410 -518 23 -88 25 -116 22 -235 -2 -76 -9 -148 -16 -165 -6 -16 -14 -41 -16 -55 -8 -46 -74 -172 -124 -240 -60 -81 -122 -139 -221 -208 -104 -71 -188 -198 -210 -317 -18 -96 -5 -90 -190 -90 l-164 0 0 50 c1 175 94 388 234 538 25 27 86 79 137 117 105 79 143 121 184 205 56 114 55 286 -2 399 -73 144 -212 234 -375 244 -76 4 -89 2 -165 -29 -102 -41 -190 -122 -236 -217 -17 -34 -29 -62 -28 -62 2 0 -4 -28 -13 -62 l-16 -63 -145 -3 c-79 -2 -155 0 -168 3 -24 6 -25 8 -18 74 17 191 134 414 276 528 30 24 62 50 70 56 64 51 224 113 325 126 91 12 118 12 194 1z M1402 679 c-143 -72 -173 -280 -55 -391 37 -36 110 -68 154 -68 98 0 202 79 229 175 28 99 -13 209 -98 270 -37 25 -54 30 -115 33 -58 2 -80 -1 -115 -19z m210 -25 c149 -94 140 -311 -16 -389 -82 -41 -156 -29 -230 36 -83 73 -98 195 -34 289 65 94 187 122 280 64z';
    const svgViewBox = '0 0 300 310';

    const quadrantesInfo = [
      { id: 'C1', x0: 0, y0: 2 * div, x1: div, y1: 3 * div, color: COLOR_AMARELO, text: 'Investimento<br>Seletivo/Cauteloso', iconType: 'svg', svgFill: '#e5ad00', icon: '' },
      { id: 'B1', x0: div, y0: 2 * div, x1: 2 * div, y1: 3 * div, color: COLOR_VERDE_MEDIO, text: 'Investimento<br>Seguro e Crescimento', icon: '' },
      { id: 'A1', x0: 2 * div, y0: 2 * div, x1: 3 * div, y1: 3 * div, color: COLOR_VERDE_ESCURO, text: 'Investimento<br>Prioritário', icon: '' },
      { id: 'C2', x0: 0, y0: div, x1: div, y1: 2 * div, color: COLOR_LARANJA, text: 'Investimento<br>Seletivo/Cauteloso', iconType: 'svg', svgFill: '#fb9d0a', icon: '' },
      { id: 'B2', x0: div, y0: div, x1: 2 * div, y1: 2 * div, color: COLOR_AMARELO, text: 'Expansão<br>Limitada ou Colheita', icon: '' },
      { id: 'A2', x0: 2 * div, y0: div, x1: 3 * div, y1: 2 * div, color: COLOR_VERDE_MEDIO, text: 'Investimento<br>Seguro e Crescimento', icon: '' },
      { id: 'C3', x0: 0, y0: 0, x1: div, y1: div, color: COLOR_VERMELHO, text: 'Zona de Perigo:<br>Colher ou desinvestir', icon: '' },
      { id: 'B3', x0: div, y0: 0, x1: 2 * div, y1: div, color: COLOR_LARANJA, text: 'Expansão<br>Limitada ou Colheita', icon: '' },
      { id: 'A3', x0: 2 * div, y0: 0, x1: 3 * div, y1: div, color: COLOR_AMARELO, text: 'Expansão<br>Limitada ou Colheita', icon: '' },
    ];

    const quadranteBorderColor = colorScheme === 'dark' ? '#141a28' : '#fafafa';
    const shapes = quadrantesInfo.map((q) => ({
      type: 'rect',
      xref: 'x',
      yref: 'y',
      x0: q.x0,
      y0: q.y0,
      x1: q.x1,
      y1: q.y1,
      fillcolor: q.color,
      opacity: 1,
      line: { width: 0, color: quadranteBorderColor },
      layer: 'below',
    }));

    const layoutImages = [];
    const quadrantLabelTraces = [];

    quadrantesInfo.forEach((q) => {
      let labelTextColor = '#FFFFFF';
      if (q.id === 'C1') { labelTextColor = TEXT_COLOR_MY_C1; } else if (q.id === 'B1') { labelTextColor = TEXT_COLOR_MY_B1; } else if (q.id === 'A1') { labelTextColor = TEXT_COLOR_MY_A1; } else if (q.id === 'C2') { labelTextColor = TEXT_COLOR_MY_C2; } else if (q.id === 'B2') { labelTextColor = TEXT_COLOR_MY_B2; } else if (q.id === 'A2') { labelTextColor = TEXT_COLOR_MY_A2; } else if (q.id === 'C3') { labelTextColor = TEXT_COLOR_MY_C3; } else if (q.id === 'B3') { labelTextColor = TEXT_COLOR_MY_B3; } else if (q.id === 'A3') { labelTextColor = TEXT_COLOR_MY_A3; }

      quadrantLabelTraces.push({
        type: 'scatter', x: [(q.x0 + q.x1) / 2], y: [(q.y0 + q.y1) / 2], mode: 'text',
        text: [q.icon ? `${q.icon}<br>${q.text}` : q.text],
        textfont: { family: 'Roboto Flex, Arial, sans-serif', size: 16, color: labelTextColor },
        textposition: 'middle center', hoverinfo: 'none', showlegend: false
      });

      // NOVO: Adicionar SVG especial para C1 e C2
      if (q.id === 'C1' || q.id === 'C2') {
        const fillColor = q.id === 'C1' ? '#e5ad00' : '#fb9d0a';
        const svgEspecial = `
<svg xmlns="http://www.w3.org/2000/svg" width="1602" height="1593" viewBox="0 0 1602 1593" preserveAspectRatio="xMidYMid meet">
  <g transform="translate(0,1593) scale(0.1,-0.1)" fill="${fillColor}" stroke="none">
    <path d="M7870 14753 c-1463 -62 -2747 -811 -3500 -2042 -364 -595 -582 -1313
-607 -1998 l-6 -173 1000 0 1000 0 7 117 c40 715 403 1348 1000 1744 276 183
590 303 931 355 154 24 480 23 635 0 748 -114 1370 -565 1700 -1231 153 -309
230 -638 230 -983 0 -362 -77 -688 -240 -1012 -109 -216 -222 -372 -405 -556
-159 -160 -220 -209 -467 -371 -357 -234 -597 -430 -857 -699 -780 -807 -1229
-1853 -1277 -2979 l-7 -155 1001 0 c836 0 1002 2 1002 14 0 52 23 288 36 366
96 583 397 1130 833 1513 138 121 196 165 371 278 189 122 332 223 452 321
876 709 1420 1715 1544 2853 23 212 23 611 0 823 -94 874 -417 1637 -975 2307
-116 139 -422 438 -568 556 -636 509 -1358 818 -2153 920 -131 16 -552 43
-600 37 -8 -1 -44 -3 -80 -5z"/>
    <path d="M7917 3589 c-618 -60 -1097 -590 -1097 -1214 0 -840 844 -1424 1645
-1139 404 144 721 527 785 949 15 99 15 287 0 380 -75 476 -440 876 -905 994
-73 18 -271 43 -320 40 -11 -1 -59 -5 -108 -10z"/>
  </g>
</svg>
`;
        const svgEspecialDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svgEspecial)}`;
        layoutImages.push({
          source: svgEspecialDataUri,
          xref: 'x', yref: 'y',
          x: (q.x0 + q.x1) / 2,
          y: (q.y0 + q.y1) / 2,
          sizex: div * 0.55,
          sizey: div * 0.55,
          xanchor: 'center', yanchor: 'middle',
          layer: 'below',
        });
        return; // Impede que o SVG antigo seja adicionado em C1 e C2
      }

      // NOVO: Adicionar SVG especial para C3
      if (q.id === 'C3') {
        const svgC3 = `
<svg xmlns="http://www.w3.org/2000/svg" width="1511" height="1534" viewBox="0 0 1511 1534" preserveAspectRatio="xMidYMid meet">
  <g transform="translate(0,1534) scale(0.1,-0.1)" fill="#c54221" stroke="none">
    <path d="M7521 14975 c-267 -289 -525 -852 -685 -1493 -59 -234 -156 -730 -156 -793 0 -8 21 -27 47 -43 25 -17 88 -61 140 -99 52 -38 96 -68 98 -66 2 2 11 56 20 119 84 595 234 1164 415 1577 60 136 143 298 159 307 12 8 147 -261 209 -415 157 -388 298 -949 369 -1461 9 -71 20 -128 24 -128 3 0 35 22 70 48 35 27 98 72 140 101 l76 53 -33 191 c-162 945 -449 1693 -801 2088 l-51 58 -41 -44z"/>
    <path d="M4158 13028 c-76 -4 -153 -12 -173 -16 l-35 -7 152 -101 c467 -311 862 -721 1164 -1209 94 -153 230 -424 294 -587 l55 -138 80 -26 c44 -15 126 -44 183 -66 57 -22 105 -38 108 -35 7 7 -52 187 -117 352 -200 511 -524 1016 -893 1393 -55 56 -84 92 -74 92 37 0 300 -53 408 -81 791 -212 1472 -677 1966 -1344 49 -67 132 -182 184 -257 52 -75 97 -137 100 -137 3 0 71 93 152 207 210 296 299 405 492 598 466 466 1000 774 1623 934 136 36 354 80 390 80 8 0 -37 -55 -99 -122 -388 -420 -657 -841 -858 -1348 -48 -120 -130 -357 -130 -374 0 -3 42 12 93 33 51 21 136 52 189 70 l96 32 49 122 c290 737 810 1377 1476 1820 127 84 136 92 112 99 -71 18 -415 29 -610 19 -851 -47 -1617 -341 -2265 -870 -213 -174 -502 -476 -654 -684 -28 -37 -53 -67 -56 -67 -3 0 -28 30 -56 68 -124 170 -317 384 -479 533 -667 612 -1498 965 -2400 1019 -191 11 -270 11 -467 -2z"/>
    <path d="M4230 10823 c-19 -1 -84 -8 -145 -13 -161 -16 -466 -70 -535 -96 -9 -3 37 -31 115 -68 562 -270 1044 -679 1402 -1191 38 -55 110 -165 158 -245 106 -174 146 -229 244 -338 121 -136 287 -261 461 -348 344 -171 764 -292 1218 -350 173 -22 519 -29 697 -15 413 34 772 116 1141 263 263 104 439 214 605 378 113 113 178 199 284 375 220 367 412 606 694 869 264 245 622 485 929 622 45 21 79 41 75 45 -9 8 -201 52 -301 69 -356 61 -787 65 -1146 10 -550 -85 -1093 -307 -1541 -630 -374 -269 -722 -643 -960 -1032 -33 -53 -63 -94 -67 -92 -4 3 -29 42 -57 87 -231 382 -589 767 -968 1040 -153 111 -309 203 -498 297 -415 206 -826 321 -1290 360 -110 9 -432 11 -515 3z m510 -328 c450 -42 804 -144 1202 -347 529 -269 985 -692 1299 -1203 54 -88 269 -466 269 -473 0 -8 -233 7 -360 24 -315 40 -588 110 -878 225 -384 153 -561 299 -762 629 -289 472 -569 795 -990 1139 l-25 20 45 1 c25 0 115 -7 200 -15z m5870 2 c-8 -8 -58 -49 -110 -92 -52 -44 -167 -151 -256 -240 -235 -235 -413 -459 -574 -724 -146 -239 -192 -302 -284 -396 -144 -146 -272 -229 -486 -315 -294 -119 -562 -190 -874 -231 -175 -23 -422 -37 -414 -23 3 5 61 106 128 224 222 390 383 611 608 837 259 260 507 443 819 605 434 225 917 352 1398 366 50 2 57 0 45 -11z"/>
    <path d="M5302 8173 c-349 -350 -557 -641 -777 -1088 -286 -582 -448 -1193 -506 -1910 -27 -325 -15 -835 26 -1170 226 -1820 1273 -3197 2725 -3584 262 -69 485 -96 800 -96 265 1 388 12 610 56 1208 239 2205 1204 2663 2579 177 530 262 1045 274 1656 12 585 -53 1111 -202 1644 -222 791 -626 1484 -1155 1981 -169 159 -152 153 -247 92 -43 -28 -102 -63 -130 -79 -29 -16 -53 -32 -53 -35 0 -4 33 -33 73 -65 39 -32 96 -80 124 -107 l53 -50 -127 -186 c-70 -102 -178 -258 -241 -346 -63 -88 -127 -177 -141 -197 -14 -21 -31 -37 -36 -38 -17 0 -305 261 -520 471 l-200 196 -120 -18 c-66 -9 -151 -21 -190 -26 l-70 -8 300 -300 c165 -165 369 -361 453 -434 83 -74 152 -137 152 -141 0 -11 -315 -397 -469 -574 -281 -323 -780 -846 -806 -846 -27 0 -550 548 -820 860 -141 163 -439 525 -458 557 -4 7 67 78 185 184 183 164 698 674 698 690 0 4 -21 11 -47 14 -27 3 -111 15 -187 27 l-140 21 -85 -91 c-145 -154 -616 -591 -625 -581 -21 23 -281 392 -394 558 l-146 215 50 44 c27 24 83 71 124 105 41 33 79 64 84 68 5 4 -18 21 -51 38 -33 16 -96 53 -139 80 -43 28 -83 51 -87 51 -5 0 -106 -98 -225 -217z m421 -980 c64 -88 117 -163 117 -166 0 -8 -322 -257 -491 -379 -261 -190 -857 -584 -867 -574 -1 2 9 50 23 107 129 510 396 1048 738 1486 l80 103 141 -208 c78 -114 194 -280 259 -369z m4164 465 c344 -443 583 -926 734 -1488 15 -57 27 -105 26 -107 -4 -3 -374 234 -542 347 -226 151 -600 426 -823 606 -2 1 54 82 125 181 71 98 169 237 218 308 118 174 175 255 179 255 2 0 39 -46 83 -102z m-3711 -1060 c286 -357 627 -739 971 -1088 l182 -186 -178 -157 c-242 -212 -519 -436 -801 -646 -248 -185 -542 -391 -556 -390 -13 1 -410 437 -555 609 -255 301 -713 896 -735 954 -3 9 61 54 178 126 395 245 838 553 1183 824 88 69 163 125 166 126 4 0 69 -78 145 -172z m3106 19 c350 -271 761 -556 1147 -794 102 -63 188 -117 190 -119 6 -6 -53 -90 -220 -314 -277 -371 -555 -707 -848 -1025 -87 -93 -171 -185 -187 -204 l-30 -34 -110 73 c-252 170 -591 423 -869 649 -200 163 -555 469 -555 479 0 3 107 114 238 247 356 360 629 665 910 1018 74 92 137 167 142 167 4 0 90 -64 192 -143z m-4792 -1447 c243 -325 581 -730 874 -1048 83 -90 152 -167 154 -171 7 -20 -1018 -615 -1033 -600 -8 9 -77 346 -100 489 -44 279 -57 431 -62 776 -6 384 13 755 37 727 4 -4 63 -82 130 -173z m6299 10 c36 -508 16 -960 -64 -1420 -24 -138 -81 -399 -88 -407 -12 -11 -716 392 -984 563 l-53 35 141 152 c287 308 669 768 919 1104 58 78 108 138 111 135 4 -4 12 -77 18 -162z m-2988 -280 c322 -284 776 -639 1137 -889 89 -62 162 -116 161 -119 -1 -11 -418 -405 -589 -559 -222 -199 -512 -442 -744 -625 -110 -87 -203 -158 -206 -158 -3 0 -88 66 -190 146 -395 312 -844 705 -1188 1040 l-163 159 133 90 c336 227 886 659 1247 978 l165 145 41 -36 c23 -20 111 -98 196 -172z m-1847 -1384 c395 -380 755 -698 1146 -1010 102 -82 185 -152 185 -157 0 -12 -293 -218 -560 -394 -287 -189 -537 -342 -818 -502 l-219 -123 -48 40 c-27 22 -106 100 -176 173 -323 335 -580 722 -757 1142 -58 136 -132 343 -126 349 2 2 69 38 149 81 268 144 688 390 905 529 55 35 104 65 109 65 5 1 99 -86 210 -193z m3537 127 c229 -146 594 -359 897 -522 85 -47 152 -89 152 -97 0 -26 -91 -266 -155 -411 -135 -304 -322 -601 -559 -888 -108 -130 -378 -396 -396 -390 -77 29 -717 411-1005 600 -196 129 -595 407 -594 415 0 3 91 77 202 165 380 302 830 699 1162 1027 94 92 175 168 181 168 6 0 57 -30 115 -67z m-1333 -1912 c257 -170 570 -365 809 -502 101 -57 183 -107 183 -110 0 -19 -295 -181 -450 -247 -346 -147 -667 -218 -1045 -229 -580 -17 -1080 113 -1582 410 -57 33 -103 63 -103 66 1 3 87 55 193 115 362 207 828 507 1217 785 l181 130 196 -140 c107 -77 288-202 401-278z"/>
  </g>
</svg>
`;
        const svgC3DataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svgC3)}`;
        layoutImages.push({
          source: svgC3DataUri,
          xref: 'x', yref: 'y',
          x: (q.x0 + q.x1) / 2,
          y: (q.y0 + q.y1) / 2,
          sizex: div * 0.55,
          sizey: div * 0.55,
          xanchor: 'center', yanchor: 'middle',
          layer: 'below',
        });
        return;
      }

      // Demais quadrantes com iconType: 'svg'
      if (q.iconType === 'svg') {
        if (q.id === 'C3' || q.id === 'C1' || q.id === 'C2') return; // Não adicionar SVG de interrogação no C1 e C2
        const fillColor = q.svgFill || 'rgba(0,0,0,0.15)';
        const svgString = `<svg viewBox="${svgViewBox}" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0,${parseFloat(svgViewBox.split(' ')[3])}) scale(0.1,-0.1)"><path d="${svgQuestionMarkPath}" fill="${fillColor}"/></g></svg>`;
        const svgDataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
        layoutImages.push({
          source: svgDataUri, xref: 'x', yref: 'y', x: (q.x0 + q.x1) / 2, y: (q.y0 + q.y1) / 2,
          sizex: div * 0.5, sizey: div * 0.5 * (parseFloat(svgViewBox.split(' ')[3]) / parseFloat(svgViewBox.split(' ')[2])),
          xanchor: 'center', yanchor: 'middle', opacity: 1, layer: 'below',
        });
      }

      // A1, A2, B1 - estrela
      if (q.id === 'A1' || q.id === 'A2' || q.id === 'B1') {
        const starColor = q.id === 'A1' ? '#478330' : '#70cb97';
        const svgString = `<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="100%" viewBox="0 0 688 736" enable-background="new 0 0 688 736" xml:space="preserve"><path fill="${starColor}" opacity="1.000000" stroke="none" d="M348.204193,67.531929 C348.982910,65.728882 348.845062,63.860081 350.593750,62.922421 C352.361633,64.282600 352.512115,66.401398 353.095215,68.244659 C373.923431,134.087555 394.716888,199.941467 415.509979,265.795441 C417.864716,273.253113 420.249786,280.702179 422.495270,288.192871 C423.292847,290.853394 424.324768,292.574707 427.602997,292.330414 C431.904877,292.009796 436.242493,292.128967 440.564758,292.127747 C505.886993,292.109497 571.209229,292.099640 636.531433,292.110352 C638.131226,292.110626 639.882141,291.536407 641.489990,293.139374 C641.182312,295.407593 639.138245,296.486816 637.651428,297.851532 C602.924194,329.726471 568.157043,361.557953 533.407288,393.408386 C514.991089,410.288025 496.631592,427.229736 478.140472,444.026733 C475.823486,446.131470 475.377563,447.880890 476.262695,450.926422 C484.338531,478.713684 492.212311,506.559723 500.122375,534.395020 C510.305725,570.230225 520.464355,606.072449 530.641785,641.909302 C533.897339,653.372620 537.178650,664.828613 540.465454,676.348633 C537.928284,677.339844 536.689453,675.581970 535.359863,674.610962 C476.436554,631.581726 417.567108,588.478882 358.638489,545.457031 C348.695312,538.197815 351.483246,539.020081 342.708435,545.391663 C299.981110,576.416748 257.349487,607.573608 214.692535,638.695435 C198.278000,650.671265 181.890350,662.683838 165.474579,674.657898 C164.309875,675.507507 163.310333,676.827942 161.470322,676.456299 C160.371628,674.415222 161.696899,672.609924 162.211166,670.797729 C177.790604,615.899841 193.420578,561.016235 209.031189,506.127167 C214.219879,487.883026 219.320740,469.613556 224.601318,451.396118 C225.545776,448.137817 225.050491,446.056274 222.396545,443.634308 C186.838898,411.183655 151.422989,378.577759 115.958206,346.025299 C98.410599,329.918671 80.820984,313.857788 63.298347,297.724121 C61.879879,296.418060 59.991943,295.400024 59.458164,293.048462 C61.341900,291.085419 63.807419,291.982025 65.958755,291.980988 C134.113892,291.948639 202.269241,291.918945 270.423859,292.120544 C275.695892,292.136139 277.786438,290.544556 279.382019,285.455811 C301.090515,216.220581 323.076630,147.072418 344.988312,77.900887 C346.043365,74.570374 347.042908,71.222282 348.204193,67.531929 M125.500015,309.062714 C117.774010,309.062714 110.048004,309.062714 102.214401,309.062714 C102.519257,311.649017 103.942619,312.407471 105.003731,313.380707 C150.428543,355.042511 195.852188,396.705688 241.362961,438.273438 C243.749084,440.452850 244.043762,442.445801 243.225952,445.302216 C225.866577,505.933624 208.562363,566.580811 191.245926,627.224487 C190.521835,629.760315 189.641068,632.273071 190.088501,635.015808 C191.926910,635.187073 192.913208,633.865295 194.068848,633.025635 C214.414062,618.240845 234.739136,603.428345 255.053207,588.600830 C285.187439,566.605408 315.326569,544.616577 345.411804,522.554260 C348.613770,520.206177 350.956207,519.060608 354.945099,521.992188 C404.329376,558.286438 453.883026,594.350281 503.425140,630.429443 C505.607117,632.018494 507.332916,634.504700 510.478149,634.791016 C511.461884,632.024963 510.508392,629.674133 509.833923,627.309387 C503.217621,604.111755 496.568878,580.923340 489.976562,557.718872 C479.294312,520.118042 468.679047,482.498047 457.926208,444.917450 C457.065430,441.909027 457.656128,440.137543 460.004669,438.038818 C470.059723,429.053192 479.875183,419.799835 489.796814,410.664520 C503.271759,398.257446 516.742859,385.846069 530.253418,373.477875 C552.363159,353.237579 574.508606,333.036438 596.611023,312.788239 C597.505005,311.969269 598.916504,311.263214 598.214844,309.032074 C596.208801,309.032074 594.068665,309.032349 591.928528,309.032074 C534.439514,309.024872 476.950348,308.951996 419.461853,309.122345 C414.300995,309.137634 411.776184,307.722321 410.231232,302.610321 C404.069794,282.223175 397.445831,261.976166 391.035065,241.663986 C378.313965,201.357712 365.619934,161.042877 352.918396,120.730423 C352.397064,119.075783 352.116913,117.275848 349.879517,116.041832 C346.608826,126.203415 343.415955,135.981583 340.312653,145.788101 C323.641571,198.469330 306.941620,251.141617 290.434174,303.874115 C289.124786,308.057068 287.115051,309.107391 282.969788,309.098175 C230.813446,308.982117 178.656662,309.048553 125.500015,309.062714 z"/></svg>`;
        const svgDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
        layoutImages.push({
          source: svgDataUri,
          xref: 'x', yref: 'y',
          x: (q.x0 + q.x1) / 2,
          y: (q.y0 + q.y1) / 2,
          sizex: div * 0.55,
          sizey: div * 0.55,
          xanchor: 'center', yanchor: 'middle', opacity: 1, layer: 'below',
        });
        return;
      }

      // A3, B2, B3 - SVG cesta
      if (q.id === 'A3' || q.id === 'B2' || q.id === 'B3') {
        const cestaColor = (q.id === 'B3') ? '#fb9d0a' : '#e5ad00';
        const svgString = `<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="100%" viewBox="0 0 688 704" enable-background="new 0 0 688 704" xml:space="preserve"><path fill="${cestaColor}" opacity="1.000000" stroke="none" d="M492.114441,558.000000 C491.852875,570.152771 492.842224,581.833374 491.584839,593.460022 C489.355377,614.074951 471.573944,630.979370 450.892456,632.296387 C449.563171,632.381042 448.228302,632.406738 446.895905,632.410278 C385.912109,632.571472 324.928375,632.746887 263.944489,632.856262 C256.963409,632.868774 249.947662,632.882141 243.006500,632.251221 C220.613541,630.215881 203.343414,612.133911 202.102646,589.663269 C201.827332,584.677063 201.886765,579.669312 201.885208,574.671509 C201.854446,476.522430 202.253464,378.370483 201.566086,280.226074 C201.357849,250.495102 211.503296,226.900055 234.185852,208.052032 C244.422791,199.545654 253.924622,190.157578 263.838257,181.256714 C265.854858,179.446121 267.023926,177.514038 266.739227,174.756546 C266.620300,173.604263 266.679382,172.420227 266.778351,171.260941 C267.587006,161.790314 266.489410,154.294037 257.472290,147.398361 C244.503464,137.480698 241.874542,119.306023 248.158218,104.656174 C254.892639,88.955437 269.832123,80.478546 288.566162,81.060417 C328.876801,82.312477 369.203094,81.663124 409.520111,81.409119 C426.495728,81.302177 442.187531,91.671783 447.013489,107.457848 C452.397919,125.070732 445.895111,143.177444 430.811462,152.189957 C428.417755,153.620209 426.938629,155.244507 427.248535,158.135071 C427.301483,158.629120 427.326050,159.147034 427.240234,159.632065 C424.843384,173.177841 429.870728,183.162659 440.228760,192.171509 C451.495636,201.970810 461.503693,213.272293 471.633850,224.310425 C485.774017,239.717987 492.196411,258.074738 492.163574,279.050018 C492.018219,371.866486 492.108429,464.683319 492.114441,558.000000 M475.846344,325.500000 C475.840973,309.167694 475.856323,292.835327 475.824493,276.503052 C475.791962,259.809540 469.457062,245.775986 457.874634,233.920044 C443.206573,218.905563 428.627167,203.804489 413.949188,188.799744 C411.839233,186.642853 410.793396,184.389099 410.853699,181.278488 C411.034485,171.949142 411.423218,162.579285 410.771729,153.292511 C410.255890,145.939774 412.402802,141.924927 419.618439,139.180710 C429.339691,135.483566 434.130646,124.688217 431.798615,115.023399 C429.288940,104.622368 421.923401,99.042313 410.696228,99.042351 C367.865356,99.042519 325.034515,99.038727 282.203644,99.048500 C270.263519,99.051231 261.971375,107.745499 261.951904,120.232346 C261.933960,131.741409 270.961700,140.838226 282.420898,140.878830 C286.253601,140.892410 290.093536,140.818481 293.916840,141.028030 C298.685455,141.289352 301.992157,144.513382 302.193726,148.775848 C302.400238,153.143326 299.074677,157.137741 294.478882,157.773239 C292.344849,158.068329 290.148285,158.116425 287.993347,158.009277 C284.271851,157.824265 283.019409,159.556717 283.111023,163.127853 C283.273407,169.456284 283.058136,175.793808 283.174866,182.124329 C283.227966,185.005249 282.352142,187.235092 280.196167,189.177902 C268.192657,199.994644 256.566223,211.255005 244.209167,221.648346 C226.005066,236.959564 217.781052,255.764633 217.977448,279.835480 C218.613815,357.825775 218.172653,435.824768 218.168854,513.820435 C218.167664,538.151794 218.047226,562.485413 218.339752,586.813721 C218.543121,603.726624 230.733429,615.496643 247.605942,615.515747 C311.767944,615.588501 375.930054,615.614319 440.092041,615.561707 C445.061493,615.557617 450.138367,615.323364 454.978119,614.305725 C466.889008,611.801270 475.981415,599.156372 475.942291,584.485229 C475.713043,498.490662 475.838928,412.495178 475.846344,325.500000 z"/><path fill="${cestaColor}" opacity="1.000000" stroke="none" d="M259.045532,324.000000 C259.041931,312.171021 259.287079,300.835144 258.974915,289.514679 C258.534851,273.555603 263.167267,260.102722 276.292816,250.095154 C281.973755,245.763748 287.076355,240.682190 292.610291,236.147171 C297.413147,232.211288 301.220612,232.234711 304.567841,235.774048 C308.024231,239.428787 307.958740,244.681656 303.768036,248.679016 C297.024506,255.111481 290.127625,261.410919 282.958099,267.359863 C277.695404,271.726593 275.943970,277.116394 275.956177,283.636658 C276.008453,311.625732 275.950714,339.615112 275.894623,367.604279 C275.889648,370.092560 275.859314,372.628387 275.395538,375.057129 C274.682617,378.790710 272.054749,380.724091 268.357819,381.064850 C264.847443,381.388458 262.246094,379.892395 260.643829,376.708527 C259.417542,374.271729 259.019043,371.718536 259.031219,368.982849 C259.097321,354.155518 259.052277,339.327667 259.045532,324.000000 z"/></svg>`;
        const svgDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
        layoutImages.push({
          source: svgDataUri,
          xref: 'x', yref: 'y',
          x: (q.x0 + q.x1) / 2,
          y: (q.y0 + q.y1) / 2,
          sizex: div * 0.55,
          sizey: div * 0.55,
          xanchor: 'center', yanchor: 'middle', opacity: 1, layer: 'below',
        });
        return;
      }
    });

    const allDataTraces = [...quadrantLabelTraces, ...productTraces];

    const axisFontColor = colorScheme === 'dark' ? '#cfd1d3' : '#000000';
    const axisTickColor = colorScheme === 'dark' ? '#cfd1d3' : '#000000';
    const axisLineColor = colorScheme === 'dark' ? '#cfd1d3' : '#000000';
    const xLineColor = colorScheme === 'dark' ? '#ffffff' : '#000000';
    const yLineColor = colorScheme === 'dark' ? '#ffffff' : '#000000';
    const noDataTextColor = colorScheme === 'dark' ? DARK_MODE_FONT_COLOR : 'black';

    const xaxisTitle = {
      text: '<b>Posição Competitiva</b>',
      font: { size: 14, family: 'Roboto Flex, Arial, sans-serif', color: colorScheme === 'dark' ? '#fff' : axisFontColor },
      standoff: 10,
    };
    const yaxisTitle = {
      text: '<b>Atratividade de Mercado</b>',
      font: { size: 14, family: 'Roboto Flex, Arial, sans-serif', color: colorScheme === 'dark' ? '#fff' : axisFontColor },
      standoff: 10,
    };

    // --- Shapes para a seta do eixo X ---
    // Seta alinhada com o texto do eixo X, sem alterar domínio ou margens
    const xAxisY_paper = -0.065; // ajuste fino para alinhar a seta com o título do eixo X
    const xLineShapes = [
      // Linha da origem até antes do texto
      {
        type: 'line',
        xref: 'paper',
        yref: 'paper',
        x0: 0,
        y0: xAxisY_paper,
        x1: 0.36,
        y1: xAxisY_paper,
        line: { color: xLineColor, width: 2 },
        layer: 'above',
        opacity: 1,
      },
      // Linha do fim do texto até o final do eixo
      {
        type: 'line',
        xref: 'paper',
        yref: 'paper',
        x0: 0.64,
        y0: xAxisY_paper,
        x1: 1,
        y1: xAxisY_paper,
        line: { color: xLineColor, width: 2 },
        layer: 'above',
        opacity: 1,
      },
      // Seta desenhada como path (compacta e sem espaço)
      {
        type: 'path',
        xref: 'paper',
        yref: 'paper',
        path: `M 1 ${xAxisY_paper} L 0.985 ${xAxisY_paper + 0.015} M 1 ${xAxisY_paper} L 0.985 ${xAxisY_paper - 0.015}`,
        line: { color: xLineColor, width: 2 },
        layer: 'above',
        opacity: 1,
      },
      // Pequeno círculo na ponta da seta para cobrir o vão
      {
        type: 'circle',
        xref: 'paper',
        yref: 'paper',
        x0: 1 - 0.001,
        y0: xAxisY_paper - 0.001,
        x1: 1 + 0.001,
        y1: xAxisY_paper + 0.001,
        fillcolor: xLineColor,
        line: { color: xLineColor, width: 0 },
        layer: 'above',
        opacity: 1,
      },
    ];
    // --- Shapes para a seta do eixo Y ---
    const yAxisX_paper = -0.067; // ajuste para alinhar com o texto do eixo Y
    const yLineShapes = [
      // Linha do início (0) até antes do texto
      {
        type: 'line',
        xref: 'paper',
        yref: 'paper',
        x0: yAxisX_paper,
        y0: 0,
        x1: yAxisX_paper,
        y1: 0.34,
        line: { color: yLineColor, width: 2 },
        layer: 'above',
        opacity: 1,
      },
      // Linha do topo (1) até depois do texto
      {
        type: 'line',
        xref: 'paper',
        yref: 'paper',
        x0: yAxisX_paper,
        y0: 0.66,
        x1: yAxisX_paper,
        y1: 1,
        line: { color: yLineColor, width: 2 },
        layer: 'above',
        opacity: 1,
      },
      // Seta desenhada como path (compacta e sem espaço, para cima)
      {
        type: 'path',
        xref: 'paper',
        yref: 'paper',
        path: `M ${yAxisX_paper} 1 L ${yAxisX_paper - 0.015} 0.985 M ${yAxisX_paper} 1 L ${yAxisX_paper + 0.015} 0.985`,
        line: { color: yLineColor, width: 2 },
        layer: 'above',
        opacity: 1,
      },
      // Pequeno círculo na ponta da seta para cobrir o vão
      {
        type: 'circle',
        xref: 'paper',
        yref: 'paper',
        x0: yAxisX_paper - 0.001,
        y0: 1 - 0.001,
        x1: yAxisX_paper + 0.001,
        y1: 1 + 0.001,
        fillcolor: yLineColor,
        line: { color: yLineColor, width: 0 },
        layer: 'above',
        opacity: 1,
      },
    ];

    const newLayout = {
      xaxis: {
        range: [0, 10], autorange: false, fixedrange: true, title: xaxisTitle,
        tickfont: { size: 11, family: 'Roboto Flex, Arial, sans-serif', color: axisFontColor },
        scaleanchor: 'y', scaleratio: TARGET_ASPECT_RATIO, showgrid: false, zeroline: false,
        tickmode: 'linear', tick0: 0, dtick: 1, ticks: 'outside', ticklen: 6, tickwidth: 1,
        tickcolor: axisTickColor, linecolor: axisLineColor, automargin: true, mirror: true,
        side: 'bottom', anchor: 'y', position: 0, rangemode: 'normal', domain: [0, 1],
      },
      yaxis: {
        range: [0, 10], autorange: false, fixedrange: true, title: yaxisTitle,
        tickfont: { size: 11, family: 'Roboto Flex, Arial, sans-serif', color: axisFontColor },
        scaleanchor: 'x', scaleratio: 1 / TARGET_ASPECT_RATIO, showgrid: false, zeroline: false,
        tickmode: 'linear', tick0: 0, dtick: 1, ticks: 'outside', ticklen: 6, tickwidth: 1,
        tickcolor: axisTickColor, linecolor: axisLineColor, automargin: true, mirror: true,
        side: 'left', anchor: 'x', position: 0, ticklabelposition: 'outside', rangemode: 'normal',
        constrain: 'domain', domain: [0, 1],
      },
      plot_bgcolor: 'rgba(0,0,0,0)', paper_bgcolor: 'rgba(0,0,0,0)', showlegend: false,
      margin: { l: 65, r: 30, t: 30, b: 60, pad: 0 }, hovermode: 'closest',
      shapes: [
        ...shapes,
        // ...xLineShapes, // Setas dos eixos removidas temporariamente
        // ...yLineShapes, // Setas dos eixos removidas temporariamente
      ],
      annotations: [
        ...(dfPlot.length === 0 && !loadingData && !errorMessage &&
          (selectedAreas.length > 0 || selectedQuadrantes.length > 0 || selectedCriterios.length > 0 || selectedProdutos.length > 0)
          ? [{
            text: 'Nenhum produto encontrado para os filtros selecionados.', xref: 'paper', yref: 'paper',
            x: 0.5, y: 0.5, showarrow: false, font: { size: 14, color: noDataTextColor, family: 'Roboto Flex, Arial, sans-serif', },
          }]
          : dfPlot.length === 0 && !loadingData && !errorMessage
            ? [{
              text: 'Nenhum dado para exibir no gráfico.', xref: 'paper', yref: 'paper',
              x: 0.5, y: 0.5, showarrow: false, font: { size: 14, color: noDataTextColor, family: 'Roboto Flex, Arial, sans-serif', },
            }] : []),
      ],
      images: layoutImages,
    };

    console.log(
      'MatrizGEPageContent: Updating plotFigure. AllDataTraces length:',
      allDataTraces.length
    );
    setPlotFigure({ data: allDataTraces, layout: newLayout });
    setPlotRevision((prev) => prev + 1);
  }, [
    originalData, selectedAreas, selectedQuadrantes, selectedProdutos, exibirTexto,
    loadingData, errorMessage, setPlotFigure, setPlotRevision, colorScheme,
    selectedModalidades, selectedCriterios // <-- garantir dependência
  ]);

  useEffect(() => {
    // Log para depuração dos valores únicos de QUADRANTE e QUADRANTES
    if (originalData && Array.isArray(originalData)) {
      const quadrantes = Array.from(new Set(originalData.map(item => item.QUADRANTE)));
      const quadrantesAlias = Array.from(new Set(originalData.map(item => item.QUADRANTES)));
      console.log('Valores únicos de QUADRANTE:', quadrantes);
      console.log('Valores únicos de QUADRANTES (alias):', quadrantesAlias);
    }
  }, [originalData]);

  if (errorMessage && !loadingData) {
    return (
      <div>
        <div
          style={{
            padding: '20px',
            textAlign: 'center',
            height: 'calc(100vh - 60px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <div style={{
            backgroundColor: 'rgb(254 226 226)',
            border: '1px solid rgb(239 68 68)',
            color: 'rgb(185 28 28)',
            padding: '16px',
            borderRadius: '8px',
            position: 'relative',
            maxWidth: '600px',
            textAlign: 'left'
          }}>
            <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', marginBottom: '8px', color: colorScheme === 'dark' ? DARK_MODE_FONT_COLOR : undefined }}>
              {/* Replaced IconAlertCircle */}
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="red" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Erro!
            </div>
            <p style={{ fontFamily: 'Roboto Flex, Arial, sans-serif', color: colorScheme === 'dark' ? DARK_MODE_FONT_COLOR : undefined }}>
              Houve um problema ao carregar os dados da Matriz GE.
            </p>
            <p
              style={{
                fontSize: '0.875rem',
                marginTop: '8px',
                fontFamily: 'Roboto Flex, Arial, sans-serif',
                color: colorScheme === 'dark' ? DARK_MODE_FONT_COLOR : undefined,
              }}
            >
              Detalhes: {errorMessage}
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '24px',
              padding: '8px 16px',
              border: '1px solid ' + (colorScheme === 'dark' ? DARK_MODE_FONT_COLOR : 'black'),
              borderRadius: '6px',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'Roboto Flex, Arial, sans-serif',
              color: colorScheme === 'dark' ? DARK_MODE_FONT_COLOR : 'black',
            }}
          >
            {/* Replaced IconX */}
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colorScheme === 'dark' ? DARK_MODE_FONT_COLOR : 'black'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, padding: 0 }}>
      {loadingData && originalData.length === 0 ? (
        <div
          style={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}
        >
          {/* Replaced Loader with simple text */}
          <span style={{ fontSize: '2rem', marginRight: '16px', color: textColor }}>Loading...</span>
          <p
            style={{
              marginLeft: '16px',
              fontSize: '1.25rem',
              fontFamily: 'Roboto Flex, Arial, sans-serif',
              color: textColor,
            }}
          >
            Carregando dados da Matriz GE...
          </p>
        </div>
      ) : (
        <>
          {/* Main Title */}
          <div style={{ paddingLeft: '24px', paddingRight: '24px' }}>
            <h2
              style={{
                fontSize: '2rem',
                textAlign: 'center',
                marginBottom: '16px',
                marginTop: 0,
                fontFamily: 'Roboto Flex',
                color: colorScheme === 'dark' ? '#ffffff' : textColor,
              }}
            >
              Ciclo de Vida de Produtos - Educação Profissional
            </h2>
          </div>

          {/* Substituir grid por flex horizontal */}
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: '32px', width: '100%' }}>
            {/* Gráfico - 60% */}
            <div style={{ flex: 3, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
              {/* Filtros acima do gráfico */}
              <div
                style={{
                  width: '100%',
                  maxWidth: '700px',
                  // marginBottom removido para aproximar os filtros do gráfico
                  marginLeft: '128px',
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'nowrap',
                  alignItems: 'center',
                }}
              >
                {/* NOVO: Filtro de Modalidade */}
                <FilterPopover
                  labelText="Modalidade"
                  options={modalidadeOptions}
                  selectedValues={selectedModalidades}
                  onChange={setSelectedModalidades}
                  buttonId="botao-popover-modalidade-main"
                  opened={openedPopover === 'modalidade'}
                  onOpenChange={(open) => setOpenedPopover(open ? 'modalidade' : null)}
                  colorScheme={colorScheme}
                />
                <FilterPopover
                  labelText="Área"
                  options={areaOptions}
                  selectedValues={selectedAreas}
                  onChange={setSelectedAreas}
                  buttonId="botao-popover-area-main"
                  opened={openedPopover === 'area'}
                  onOpenChange={(open) => setOpenedPopover(open ? 'area' : null)}
                  colorScheme={colorScheme}
                />
                <FilterPopover
                  labelText="Quadrante"
                  options={quadranteOptions}
                  selectedValues={selectedQuadrantes}
                  onChange={setSelectedQuadrantes}
                  buttonId="botao-popover-quadrante-main"
                  opened={openedPopover === 'quadrante'}
                  onOpenChange={(open) => setOpenedPopover(open ? 'quadrante' : null)}
                  colorScheme={colorScheme}
                />
                <FilterPopoverHierarchical
                  labelText="Critério"
                  criteriosConfig={CRITERIOS_CONFIG}
                  selectedCriterios={selectedCriterios}
                  onChange={setSelectedCriterios}
                  buttonId="botao-popover-criterio-main"
                  opened={openedPopover === 'criterio'}
                  onOpenChange={(open) => setOpenedPopover(open ? 'criterio' : null)}
                  colorScheme={colorScheme}
                  showTooltip={showTooltip}
                  hideTooltip={hideTooltip}
                  tooltipInfo={tooltipInfo}
                />
                <FilterPopover
                  labelText="Produto"
                  options={produtoOptions}
                  selectedValues={selectedProdutos}
                  onChange={setSelectedProdutos}
                  buttonId="botao-popover-produto-main"
                  opened={openedPopover === 'produto'}
                  onOpenChange={(open) => setOpenedPopover(open ? 'produto' : null)}
                  colorScheme={colorScheme}
                  enableSearch={true}
                />
                <button
                  onClick={onResetFilters}
                  style={{
                    backgroundColor: colorScheme === 'dark' ? '#ff6f77' : '#ffe3e3',
                    color: '#c92a2a',
                    border: '1px solid #c92a2a',
                    padding: '8px 20px',
                    fontSize: '0.8rem',
                    borderRadius: '12px',
                    minWidth: '90px',
                    whiteSpace: 'nowrap',
                    fontFamily: 'Roboto Flex, Arial, sans-serif',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'background-color 0.2s ease',
                    gap: '6px',
                  }}
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    // Cria um gradiente radial que segue o cursor
                    if (colorScheme === 'dark') {
                      e.currentTarget.style.background = `radial-gradient(circle 30px at ${x}px ${y}px, #ffb3b8, #ff6f77)`;
                    } else {
                      e.currentTarget.style.background = `radial-gradient(circle 30px at ${x}px ${y}px, #ffc9c9, #ffe3e3)`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = colorScheme === 'dark' ? '#ff6f77' : '#ffe3e3';
                  }}
                  onMouseDown={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    
                    // Cria o elemento de onda
                    const ripple = document.createElement('div');
                    ripple.style.position = 'absolute';
                    ripple.style.left = `${x}px`;
                    ripple.style.top = `${y}px`;
                    ripple.style.width = '0';
                    ripple.style.height = '0';
                    ripple.style.backgroundColor = 'rgba(255, 201, 201, 0.4)';
                    ripple.style.borderRadius = '50%';
                    ripple.style.transform = 'translate(-50%, -50%)';
                    ripple.style.transition = 'all 0.6s ease-out';
                    
                    e.currentTarget.appendChild(ripple);
                    
                    // Anima a onda
                    requestAnimationFrame(() => {
                      ripple.style.width = '200px';
                      ripple.style.height = '200px';
                      ripple.style.opacity = '0';
                    });
                    
                    // Remove o elemento após a animação
                    setTimeout(() => {
                      ripple.remove();
                    }, 600);
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="#c92a2a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '2px', display: 'flex', alignItems: 'center'}} viewBox="0 0 24 24">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                  <span style={{ position: 'relative', zIndex: 1 }}>Resetar</span>
                </button>
              </div>
              {/* Gráfico */}
              <div
                id="grafico-matriz-plotly"
                style={{
                  width: '100%',
                  maxWidth: '700px',
                  position: 'relative',
                  aspectRatio: TARGET_ASPECT_RATIO,
                  margin: '0 auto',
                  minHeight: 350,
                  height: '100%',
                  overflow: 'hidden',
                  flex: 1,
                }}
              >

                {/* Gráfico Plotly */}
                <Suspense fallback={<PlotlyLoadingFallback />}>
                  {plotFigureFromApp.data && plotFigureFromApp.layout ? (
                    <Plot
                      divId="grafico-matriz-plotly"
                      data={plotFigureFromApp.data}
                      layout={{ ...plotFigureFromApp.layout }}
                      config={{ displayModeBar: false, responsive: true }}
                      revision={plotRevisionFromApp}
                      useResizeHandler={true}
                      style={{
                        width: '100%',
                        height: '100%',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                      }}
                    />
                  ) : (
                    <p style={{ textAlign: 'center', fontSize: '1rem', color: textColor }}>Gráfico será renderizado aqui.</p>
                  )}
                </Suspense>
              </div>
            </div>
            {/* Explicação - 40% */}
            <div style={{ flex: 1.2, minWidth: 0, minHeight: 0, maxWidth: '700px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginTop: '80.5px', paddingLeft: '32px', paddingRight: '32px', height: '100%' }}>
              <ExplanationContent colorScheme={colorScheme} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// --- Main App Component ---
export default function MatrizGE() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // --- CACHE LOCALSTORAGE ---
  const CACHE_KEY = 'matrizGEData';
  const CACHE_VERSION = 'v1'; // Troque se mudar a estrutura dos dados

  // Redireciona para login se não estiver autenticado
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Mostra loading enquanto verifica autenticação
  if (status === 'loading') {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#fafafa'
      }}>
        Carregando...
      </div>
    );
  }

  // Não renderiza nada se não estiver autenticado
  if (!session) {
    return null;
  }

  // `useMantineColorScheme` and `useMantineTheme` are no longer available.
  // We will simulate their behavior with simple state management and mock theme object.
  const [currentPage, setCurrentPage] = useState('matriz');
  const [effectiveColorScheme, setEffectiveColorScheme] = useState('light');
  const [isClient, setIsClient] = useState(false);
  const [rotation, setRotation] = useState(0);

  const [loadingData, setLoadingData] = useState(true);
  const [originalData, setOriginalData] = useState([]);
  const [selectedAreas, setSelectedAreas] = useState([]);
  const [selectedQuadrantes, setSelectedQuadrantes] = useState([]);
  const [selectedProdutos, setSelectedProdutos] = useState([]);
  const [exibirTexto, setExibirTexto] = useState(true);
  const [plotFigure, setPlotFigure] = useState({ data: [], layout: {} });
  const [plotRevision, setPlotRevision] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [openedPopover, setOpenedPopover] = useState(null); // 'area', 'quadrante', 'produto', null
  const [selectedModalidades, setSelectedModalidades] = useState([]); // NOVO: estado para modalidade
  const [selectedCriterios, setSelectedCriterios] = useState([]); // NOVO: estado para critérios
  const [tooltipInfo, setTooltipInfo] = useState({ visible: false, text: '', top: 0, left: 0 });

  const showTooltip = (text, rect) => {
    setTooltipInfo({
      visible: true,
      text,
      top: rect.top - 8,
      left: rect.left + rect.width / 2,
    });
  };
  const hideTooltip = () => setTooltipInfo(info => ({ ...info, visible: false }));

  // Mock theme object to replace useMantineTheme()
  const theme = {
    colors: {
      gray: ['#f8f9fa', '#e9ecef', '#dee2e6', '#ced4da', '#adb5bd', '#6c757d', '#495057', '#343a40', '#212529'],
      blue: ['#e7f5ff', '#d0ebff', '#a5d8ff', '#74c0fc', '#4dabf7', '#339af0', '#228be6', '#1971c2', '#1864ab'],
    },
    spacing: {
      xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px',
    },
    black: 'black',
    white: 'white',
    primaryColor: 'blue',
  };

  // 1. Estado para animação do download
  const [downloadRotation, setDownloadRotation] = useState(0);
  // 1. Estado para animação de pulso do download
  const [downloadPulse, setDownloadPulse] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Simulate detecting color scheme, but only set if it's not already set to 'dark' by the previous state
    if (!effectiveColorScheme) {
      setEffectiveColorScheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    }
  }, [effectiveColorScheme]);


  useEffect(() => {
    async function fetchData() {
      setLoadingData(true);
      setErrorMessage('');
      // --- Tenta buscar do localStorage ---
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.version === CACHE_VERSION && Array.isArray(parsed.data)) {
            console.log('APP: Usando dados do cache. Primeiro item:', parsed.data[0]);
            console.log('APP: Campos disponíveis no primeiro item:', Object.keys(parsed.data[0]));
            setOriginalData(parsed.data);
            setLoadingData(false);
            return;
          }
        }
      } catch (e) {
        // Se der erro, ignora o cache
        console.warn('Erro ao ler cache localStorage:', e);
      }
      // --- Busca da API ---
      try {
        const response = await fetch('/api/get-excel-data');
        if (!response.ok) {
          let errorDetails = response.statusText;
          try {
            const errData = await response.json();
            errorDetails = `${errData.error || response.statusText} ${errData.details || ''}`;
          } catch (jsonError) {
            console.warn('APP: Corpo do erro da API não é JSON.', jsonError);
          }
          throw new Error(`HTTP error ${response.status}: ${errorDetails}`);
        }
        const dataFromAPI = await response.json();
        if (!Array.isArray(dataFromAPI)) {
          throw new Error('APP: Formato de dados inesperado da API.');
        }
        console.log('APP: Dados recebidos da API. Primeiro item:', dataFromAPI[0]);
        console.log('APP: Campos disponíveis no primeiro item da API:', Object.keys(dataFromAPI[0]));
        const processedData = dataFromAPI.map((row) => {
          const posCompetitiva = parseFloat(row['VALOR FINAL']);
          const atratMercado = parseFloat(row['VALOR FINAL2']);
          const horaAluno = parseFloat(row[KEY_HORA_ALUNO]);
          return {
            ...row,
            [KEY_POSICAO_COMPETITIVA]: isNaN(posCompetitiva) ? null : posCompetitiva,
            [KEY_ATRATIVIDADE_MERCADO]: isNaN(atratMercado) ? null : atratMercado,
            [KEY_HORA_ALUNO]: isNaN(horaAluno) ? 1 : horaAluno || 1,
          };
        });
        setOriginalData(processedData);
        // Salva no cache
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ version: CACHE_VERSION, data: processedData }));
        } catch (e) {
          console.warn('Erro ao salvar cache localStorage:', e);
        }
      } catch (error) {
        console.error('APP: Falha ao carregar ou processar dados da API:', error);
        setErrorMessage(
          `Erro ao carregar dados: ${error.message}. Verifique o console para mais detalhes.`
        );
        setOriginalData([]);
      } finally {
        setLoadingData(false);
      }
    }
    if (currentPage === 'matriz') {
      fetchData();
    } else {
      setLoadingData(false);
      setOriginalData([]);
    }
  }, [currentPage]);

  // Substitua a definição de getUniqueSortedOptions por esta versão tolerante:
  function getUniqueSortedOptions(data, keyOrFn) {
    if (!Array.isArray(data) || data.length === 0) return [];
    let getValue;
    if (typeof keyOrFn === 'function') {
      getValue = keyOrFn;
    } else {
      getValue = (item) => item[keyOrFn];
    }
    const uniqueValues = Array.from(
      new Set(
        data
          .map(getValue)
          .filter((val) => val !== null && val !== undefined && String(val).trim() !== '')
      )
    ).sort();
    return uniqueValues.map((val) => ({ label: String(val), value: String(val) }));
  }



  const areaOptions = useMemo(() => {
    let source = originalData;
    if (selectedModalidades.length > 0)
      source = source.filter((item) =>
        selectedModalidades.map(normalizeString).includes(normalizeString(item[KEY_MODALIDADE]))
      );
    if (selectedQuadrantes.length > 0)
      source = source.filter((item) => selectedQuadrantes.includes(String(item[KEY_GRANDE_AREA])));
    if (selectedCriterios.length > 0) {
      source = source.filter((item) => {
        return selectedCriterios.some(criterioKey => {
          const [criterioName, nota] = criterioKey.split(':');
          const criterioValue = item[criterioName] || item[criterioName.toLowerCase()] || item[criterioName.toUpperCase()];
          return criterioValue && String(criterioValue).includes(String(nota));
        });
      });
    }
    if (selectedProdutos.length > 0)
      source = source.filter((item) => selectedProdutos.includes(String(item[KEY_PRODUTO])));
    return getUniqueSortedOptions(source, KEY_GRANDE_AREA);
  }, [originalData, selectedModalidades, selectedQuadrantes, selectedCriterios, selectedProdutos, getUniqueSortedOptions]);

  const quadranteOptions = useMemo(() => {
    let source = originalData;
    if (selectedModalidades.length > 0)
      source = source.filter((item) =>
        selectedModalidades.map(normalizeString).includes(normalizeString(item[KEY_MODALIDADE]))
      );
    if (selectedAreas.length > 0)
      source = source.filter((item) => selectedAreas.includes(String(item[KEY_GRANDE_AREA])));
    if (selectedCriterios.length > 0) {
      source = source.filter((item) => {
        return selectedCriterios.some(criterioKey => {
          const [criterioName, nota] = criterioKey.split(':');
          const criterioValue = item[criterioName] || item[criterioName.toLowerCase()] || item[criterioName.toUpperCase()];
          return criterioValue && String(criterioValue).includes(String(nota));
        });
      });
    }
    if (selectedProdutos.length > 0)
      source = source.filter((item) => selectedProdutos.includes(String(item[KEY_PRODUTO])));
    // Buscar opções de quadrante de forma tolerante
    return getUniqueSortedOptions(source, getQuadranteValue);
  }, [originalData, selectedModalidades, selectedAreas, selectedCriterios, selectedProdutos, getUniqueSortedOptions]);

  const produtoOptions = useMemo(() => {
    let source = originalData;
    if (selectedModalidades.length > 0)
      source = source.filter((item) =>
        selectedModalidades.map(normalizeString).includes(normalizeString(item[KEY_MODALIDADE]))
      );
    if (selectedAreas.length > 0)
      source = source.filter((item) => selectedAreas.includes(String(item[KEY_GRANDE_AREA])));
    if (selectedQuadrantes.length > 0)
      source = source.filter((item) => selectedQuadrantes.includes(String(item[KEY_QUADRANTES])));
    if (selectedCriterios.length > 0) {
      source = source.filter((item) => {
        return selectedCriterios.some(criterioKey => {
          const [criterioName, nota] = criterioKey.split(':');
          const criterioValue = item[criterioName] || item[criterioName.toLowerCase()] || item[criterioName.toUpperCase()];
          return criterioValue && String(criterioValue).includes(String(nota));
        });
      });
    }
    return getUniqueSortedOptions(source, KEY_PRODUTO);
  }, [originalData, selectedModalidades, selectedAreas, selectedQuadrantes, selectedCriterios, getUniqueSortedOptions]);

  const modalidadeOptions = useMemo(() => {
    let source = originalData;
    if (selectedAreas.length > 0)
      source = source.filter((item) => selectedAreas.includes(String(item[KEY_GRANDE_AREA])));
    if (selectedQuadrantes.length > 0)
      source = source.filter((item) => selectedQuadrantes.includes(String(item[KEY_QUADRANTES])));
    if (selectedCriterios.length > 0) {
      source = source.filter((item) => {
        return selectedCriterios.some(criterioKey => {
          const [criterioName, nota] = criterioKey.split(':');
          const criterioValue = item[criterioName] || item[criterioName.toLowerCase()] || item[criterioName.toUpperCase()];
          return criterioValue && String(criterioValue).includes(String(nota));
        });
      });
    }
    if (selectedProdutos.length > 0)
      source = source.filter((item) => selectedProdutos.includes(String(item[KEY_PRODUTO])));
    // Usar o valor original como value e label
    const uniqueValues = Array.from(
      new Set(
        source
          .map((item) => String(item[KEY_MODALIDADE] || '').trim())
          .filter((val) => val !== '')
      )
    );
    return uniqueValues.map((val) => ({ label: val, value: val }));
  }, [originalData, selectedAreas, selectedQuadrantes, selectedCriterios, selectedProdutos]);

  const handleResetFilters = () => {
    setSelectedModalidades([]);
    setSelectedAreas([]);
    setSelectedQuadrantes([]);
    setSelectedCriterios([]);
    setSelectedProdutos([]);
    setExibirTexto(true);
    // Limpa o cache se quiser garantir atualização
    // localStorage.removeItem(CACHE_KEY);
    console.log('APP: Filtros resetados.');
  };

  // Função temporária para limpar cache
  const handleClearCache = () => {
    localStorage.removeItem(CACHE_KEY);
    console.log('APP: Cache limpo. Recarregando dados...');
    window.location.reload();
  };

  const handleDownloadRequest = () => {
    const container = document.getElementById('grafico-matriz-plotly');
    // Busca o div real do Plotly (classe js-plotly-plot) dentro do container
    const plotlyDiv = container?.querySelector('.js-plotly-plot') || container;

    // Detecta o tamanho real do container na tela
    const rect = container?.getBoundingClientRect();
    const exportWidth = rect ? Math.round(rect.width) : 900;
    const exportHeight = rect ? Math.round(rect.height) : 870;

    if (plotlyDiv && plotFigure && plotFigure.layout && window.Plotly) {
      const currentLayout = JSON.parse(JSON.stringify(plotFigure.layout));

      currentLayout.width = exportWidth;
      currentLayout.height = exportHeight;
      currentLayout.autosize = false;

      window.Plotly.toImage(plotlyDiv, {
        format: 'png',
        width: exportWidth,
        height: exportHeight,
      })
        .then((dataUrl) => {
          const link = document.createElement('a');
          link.download = 'matriz_ge.png';
          link.href = dataUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        })
        .catch((err) => {
          console.error('APP: Erro ao baixar gráfico:', err);
          console.warn('Houve um erro ao tentar baixar o gráfico.');
        });
    } else {
      console.warn(
        'APP: Elemento do gráfico não encontrado, Plotly não disponível ou plotFigure não definido para download.'
      );
    }
  };

  const toggleColorScheme = () => {
    const nextScheme = effectiveColorScheme === 'dark' ? 'light' : 'dark';
    setEffectiveColorScheme(nextScheme);
    setRotation(prev => prev + 360);
  };

  const handleNavChange = (page) => {
    setCurrentPage(page);
  };

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
          // Removido overflow: 'hidden' para permitir scroll
          backgroundColor: effectiveColorScheme === 'dark' ? '#121212' : '#fafafa',
          fontFamily: 'Roboto Flex, Arial, sans-serif',
        }}
      >
        <AppSidebar
          colorScheme={effectiveColorScheme}
          currentPage={currentPage}
          onNavChange={handleNavChange}
        />
        <div
          style={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            overflowX: 'hidden',
            minHeight: '100vh',
            overflowY: 'auto',
            backgroundColor: effectiveColorScheme === 'dark' ? '#121212' : '#fafafa',
            position: 'relative',
          }}
        >
          {isClient && (
            <div style={{ position: 'absolute', top: theme.spacing.sm, right: theme.spacing.sm, zIndex: 10, display: 'flex', alignItems: 'center', gap: 2 }}>
              {currentPage === 'matriz' && (
                <>
                  {/* Botão de exibir/ocultar nomes */}
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
                        color: '#FF3355',
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
                  {/* Botão de baixar gráfico */}
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
                        color: '#FF3355',
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
                  {/* Botão temporário para limpar cache */}
                  <button
                    onClick={handleClearCache}
                    title="Limpar cache e recarregar"
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
                        color: '#FF3355',
                        display: 'flex',
                        alignItems: 'center',
                        verticalAlign: 'middle',
                      }}
                    >
                      refresh
                    </span>
                  </button>
                </>
              )}
              {/* Botão de tema */}
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
                    color: '#FF3355',
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
              paddingTop: isClient
                ? `calc(${theme.spacing.sm} + 36px + ${theme.spacing.sm})`
                : 0,
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
                modalidadeOptions={modalidadeOptions}
                selectedModalidades={selectedModalidades}
                setSelectedModalidades={setSelectedModalidades}
                selectedCriterios={selectedCriterios}
                setSelectedCriterios={setSelectedCriterios}
                showTooltip={showTooltip} // <-- Adicionado
                hideTooltip={hideTooltip} // <-- Adicionado
                tooltipInfo={tooltipInfo} // <-- Adicionado
              />
            )}
            {currentPage === 'nota' && <NotaTecnicaPage colorScheme={effectiveColorScheme} />}
          </div>
        </div>
      </div>
      {tooltipInfo.visible && (
        <div style={{
          position: 'fixed',
          top: tooltipInfo.top,
          left: tooltipInfo.left,
          transform: 'translate(-50%, -100%)',
          backgroundColor: effectiveColorScheme === 'dark' ? '#232323' : '#fff',
          color: effectiveColorScheme === 'dark' ? '#cfd1d3' : 'black',
          padding: '8px 22px',
          borderRadius: '8px',
          fontSize: '0.8rem',
          lineHeight: 1.3,
          whiteSpace: 'normal',
          maxWidth: '480px',
          minWidth: '320px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
          border: '1px solid ' + (effectiveColorScheme === 'dark' ? '#444' : '#ddd'),
          zIndex: 99999,
          fontFamily: 'Roboto Flex, Arial, sans-serif',
          textAlign: 'left',
          pointerEvents: 'none',
        }}>
          {tooltipInfo.text.split('\n').map((line, i) => <React.Fragment key={i}>{line}<br/></React.Fragment>)}
          <div style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '7px solid transparent',
            borderRight: '7px solid transparent',
            borderTop: '7px solid ' + (effectiveColorScheme === 'dark' ? '#232323' : '#fff'),
          }} />
        </div>
      )}
    </>
  );
}
