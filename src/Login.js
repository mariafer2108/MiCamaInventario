import React, { useState } from 'react';
import { Eye, EyeOff, User, Lock, UserPlus } from 'lucide-react';

const Login = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const validateForm = () => {
    if (!formData.username || !formData.password) {
      setError('Por favor, completa todos los campos');
      return false;
    }
    if (formData.username.length < 3) {
      setError('El usuario debe tener al menos 3 caracteres');
      return false;
    }
    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setError('');

    try {
      // Simular delay de autenticación
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (isLogin) {
        // Verificar credenciales
        const users = JSON.parse(localStorage.getItem('inventoryUsers') || '[]');
        const user = users.find(u => u.username === formData.username && u.password === formData.password);
        
        if (user) {
          localStorage.setItem('currentUser', JSON.stringify({
            username: user.username,
            loginTime: new Date().toISOString()
          }));
          onLogin(user);
        } else {
          setError('Usuario o contraseña incorrectos');
        }
      } else {
        // Registrar nuevo usuario
        const users = JSON.parse(localStorage.getItem('inventoryUsers') || '[]');
        
        if (users.find(u => u.username === formData.username)) {
          setError('El usuario ya existe');
          return;
        }

        const newUser = {
          id: Date.now(),
          username: formData.username,
          password: formData.password,
          createdAt: new Date().toISOString()
        };

        users.push(newUser);
        localStorage.setItem('inventoryUsers', JSON.stringify(users));
        
        localStorage.setItem('currentUser', JSON.stringify({
          username: newUser.username,
          loginTime: new Date().toISOString()
        }));
        
        onLogin(newUser);
      }
    } catch (error) {
      setError('Error en el servidor. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 bg-white rounded-lg flex items-center justify-center mb-4 shadow-lg p-2">
              <img 
                src="/img/micama.jpg" 
                alt="MiCama Logo" 
                className="h-12 w-12 object-contain"
              />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">
              {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
            </h2>
            <p className="text-gray-600 mt-2">
              {isLogin ? 'Accede a tu inventario' : 'Crea tu cuenta para comenzar'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usuario
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ingresa tu usuario"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ingresa tu contraseña"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Confirma tu contraseña"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  {isLogin ? <User className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
                  {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setFormData({ username: '', password: '', confirmPassword: '' });
              }}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              disabled={isLoading}
            >
              {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
            </button>
          </div>
        </div>
        <div className="text-center text-sm text-gray-500">
          <div className="flex items-center justify-center gap-2 mb-1">
            <img 
              src="/img/micama.jpg" 
              alt="MiCama Logo" 
              className="h-6 w-6 object-contain"
            />
            <p>Sistema de Inventario MiCama</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;