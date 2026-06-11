import React from 'react';
import { ExternalLink, Mail } from 'lucide-react';
import { colors } from '../theme/colors';

export default function AboutPage() {
  return (
    <div className="pt-4 pb-8 space-y-6">
      <div>
        <h1 className="text-2xl font-light" style={{ color: colors.textPrimary }}>
          Sobre o NTRSL AI
        </h1>
        <p className="text-sm mt-3 leading-relaxed" style={{ color: colors.textSecondary }}>
          O <strong style={{ color: colors.textPrimary }}>NTRSL AI</strong> é mais do que um simples
          aplicativo de monitoramento; é o seu companheiro inteligente na jornada por uma vida mais
          saudável. Desenvolvido por <strong style={{ color: colors.textPrimary }}>Cristian Ferreira Carlos</strong>,
          este projeto utiliza o poder da <strong style={{ color: colors.textPrimary }}>Inteligência Artificial</strong>{' '}
          para ir além dos números, oferecendo uma experiência de saúde e bem-estar verdadeiramente
          personalizada e inclusiva.
        </p>
      </div>

      <div
        className="rounded-2xl border p-5 space-y-4"
        style={{ background: colors.surface, borderColor: colors.border }}
      >
        <h2 className="text-base font-semibold" style={{ color: colors.textPrimary }}>
          O que nos torna diferentes?
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: colors.textSecondary }}>
          Nossa missão é democratizar o acesso a hábitos saudáveis. Em vez de apenas contar calorias,
          nossa IA atua como um especialista em saúde pessoal, analisando seus dados diários para
          fornecer recomendações que se encaixam na sua realidade.
        </p>
        <ul className="text-sm space-y-2 list-disc pl-5" style={{ color: colors.textSecondary }}>
          <li>
            <strong style={{ color: colors.textPrimary }}>Análise Inteligente:</strong> insights
            personalizados com base em metas, dieta e atividades.
          </li>
          <li>
            <strong style={{ color: colors.textPrimary }}>Foco na Acessibilidade:</strong>{' '}
            recomendações de refeições e exercícios de baixo custo.
          </li>
          <li>
            <strong style={{ color: colors.textPrimary }}>Monitoramento Completo:</strong> balanço
            calórico, macros e progresso visual.
          </li>
          <li>
            <strong style={{ color: colors.textPrimary }}>Interface Intuitiva:</strong> design limpo
            e motivador para o dia a dia.
          </li>
        </ul>
      </div>

      <div
        className="rounded-2xl border p-5"
        style={{ background: colors.surfaceWarm, borderColor: colors.border }}
      >
        <p className="text-sm leading-relaxed" style={{ color: colors.textSecondary }}>
          Este projeto foi desenvolvido como parte das Atividades Extensionistas do curso de
          Engenharia da Computação no Centro Universitário Internacional UNINTER, com o objetivo de
          aplicar tecnologia para a inclusão digital na saúde.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <a
            href="mailto:cristianfc2015@hotmail.com"
            className="inline-flex items-center gap-2 text-sm font-medium"
            style={{ color: colors.accent }}
          >
            <Mail className="w-4 h-4" />
            cristianfc2015@hotmail.com
          </a>
          <a
            href="https://github.com/CRIZANTE1/NTRSL_AI"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium"
            style={{ color: colors.accent }}
          >
            <ExternalLink className="w-4 h-4" />
            Repositório no GitHub
          </a>
        </div>
      </div>
    </div>
  );
}
