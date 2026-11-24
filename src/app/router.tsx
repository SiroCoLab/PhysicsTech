import { createHashRouter, Link, useRouteError } from 'react-router';
import { EmptyState, ErrorState } from '../components/ui/Primitives';
import { ru } from '../i18n/ru';
import { AdminPage, AdminUserPage } from '../pages/AdminPages';
import { ErrorsPage } from '../pages/ErrorsPage';
import { ExamResultPage } from '../pages/exam/ExamResultPage';
import { ExamRunPage } from '../pages/exam/ExamRunPage';
import { ExamSetupPage } from '../pages/exam/ExamSetupPage';
import { FormulaLabPage, FormulasPage, TrigPage } from '../pages/FormulasPage';
import { HomePage } from '../pages/HomePage';
import { PathPage } from '../pages/PathPage';
import { PracticePage } from '../pages/PracticePage';
import { ProblemsPage, ProblemTypePage } from '../pages/ProblemsPage';
import { ProfilePage } from '../pages/ProfilePage';
import { ProgressPage } from '../pages/ProgressPage';
import { SessionPage } from '../pages/SessionPage';
import { TopicPage } from '../pages/TopicPage';
import { AppShell } from './AppShell';
import type { RouteHandle } from './AppShell';

function RouteError() {
  const err = useRouteError();
  return (
    <div className="content">
      <ErrorState text={err instanceof Error ? err.message : ru.common.errorText} />
      <p className="center"><a className="btn" href="#/">{ru.common.toHome}</a></p>
    </div>
  );
}

function NotFound() {
  return <EmptyState icon="path" title={ru.common.notFound} text={ru.common.notFoundText} action={<Link className="btn btn-primary" to="/">{ru.common.toHome}</Link>} />;
}

const h = (x: RouteHandle) => x;

// Hash routing works from a local file, static hosting and inside a Telegram Mini App without server rewrites.
export const router = createHashRouter([
  {
    path: '/',
    element: <AppShell />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <HomePage />, handle: h({ home: true }) },
      { path: 'path', element: <PathPage />, handle: h({ title: ru.path.title, back: '/' }) },
      { path: 'topic/:id', element: <TopicPage />, handle: h({ title: ru.nav.theory, back: '/path' }) },
      { path: 'practice', element: <PracticePage />, handle: h({ title: ru.practice.title, back: '/' }) },
      { path: 'session', element: <SessionPage />, handle: h({ title: ru.practice.title, back: '/practice', focus: true }) },
      { path: 'problems', element: <ProblemsPage />, handle: h({ title: ru.problems.title, back: '/practice' }) },
      { path: 'problems/:id', element: <ProblemTypePage />, handle: h({ title: ru.nav.problems, back: '/problems' }) },
      { path: 'errors', element: <ErrorsPage />, handle: h({ title: ru.errors.title, back: '/practice' }) },
      { path: 'exam', element: <ExamSetupPage />, handle: h({ title: ru.exam.title, back: '/' }) },
      { path: 'exam/run', element: <ExamRunPage />, handle: h({ title: ru.exam.title, back: '/exam', focus: true }) },
      { path: 'exam/result', element: <ExamResultPage />, handle: h({ title: ru.exam.resultTitle, back: '/exam' }) },
      { path: 'progress', element: <ProgressPage />, handle: h({ title: ru.progress.title, back: '/profile' }) },
      { path: 'profile', element: <ProfilePage />, handle: h({ title: ru.profile.title, back: '/' }) },
      { path: 'formulas', element: <FormulasPage />, handle: h({ title: ru.formulas.title, back: '/path' }) },
      { path: 'formulas/lab', element: <FormulaLabPage />, handle: h({ title: ru.formulas.labTitle, back: '/formulas' }) },
      { path: 'trig', element: <TrigPage />, handle: h({ title: ru.formulas.trigTitle, back: '/path' }) },
      { path: 'admin', element: <AdminPage />, handle: h({ title: ru.admin.title, back: '/profile' }) },
      { path: 'admin/:id', element: <AdminUserPage />, handle: h({ title: ru.admin.card, back: '/admin' }) },
      { path: '*', element: <NotFound />, handle: h({ title: ru.common.notFound, back: '/' }) },
    ],
  },
]);
