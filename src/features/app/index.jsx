import Header from './components/Header';
import Main from './components/Main';

const AppLayout = () => {
    return (
        <div className='h-full grid grid-cols-[auto_1fr]'>
            <Header />
            <Main />
        </div>
    )
}

export default AppLayout;