import { Link } from 'react-router';
import styles from './ui.module.css';

export function Action({ to, secondary = false, children, ...props }) {
  const className = secondary ? styles.secondary : styles.action;
  if (to) return <Link to={to} className={className} {...props}>{children}</Link>;
  return <button type="button" className={className} {...props}>{children}</button>;
}

export function PageHeading({ title, children }) {
  return <header className={styles.heading}><h1>{title}</h1><p>{children}</p></header>;
}

export function Status({ title, children, action, kind = 'empty', heading: Heading = 'h2' }) {
  return (
    <section className={styles.status} role={kind === 'error' ? 'alert' : 'status'}>
      <Heading>{title}</Heading>
      {children && <p>{children}</p>}
      {action}
    </section>
  );
}
